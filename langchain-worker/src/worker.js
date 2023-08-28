/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HtmlToTextTransformer } from "langchain/document_transformers/html_to_text";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAI } from "langchain/llms/openai";
import { ConversationalRetrievalQAChain } from "langchain/chains";

export default {
  async fetch(request, env) {
    try {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }

      // Parse the request body
      let data = await request.json();

      // Extract values from the parsed body
      const question = data.question;
      const history = data.history ?? "";
      const token = request.headers.get("Authorization");

      if (token !== env.SECRET_TOKEN) {
        return new Response("Unauthorized", { status: 403 });
      }

      // Set the template for the prompt
      const promptTemplate = `
		Help the user code directly with the information you get. You should be able to help the user understand how to use it in their own javascript code.
		Question: {question}. Answer:
		`;

      // create the new prompt with the question and the template
      const prompt = promptTemplate.replace("{question}", question);

      // Load, split, transform, and embed the document
      const loader = new CheerioWebBaseLoader(
        "https://js.langchain.com/docs/guides/expression_language/cookbook"
      );
      const docs = await loader.load();

      const splitter = RecursiveCharacterTextSplitter.fromLanguage("html");
      const transformer = new HtmlToTextTransformer();
      const sequence = splitter.pipe(transformer);
      const newDocuments = await sequence.invoke(docs);

      const vectorStore = await MemoryVectorStore.fromDocuments(
        newDocuments,
        new OpenAIEmbeddings({ openAIApiKey: env.OPENAI_API_KEY })
      );

      // Model and chain setup
      const model = new OpenAI({
        model_name: "gpt-3.5-turbo-4k",
        openAIApiKey: env.OPENAI_API_KEY,
        temperature: 0,
      });

      const chain = ConversationalRetrievalQAChain.fromLLM(
        model,
        vectorStore.asRetriever()
      );

      // Call the chain with the prompt and the history
      const res = await chain.call({
        question: prompt,
        chat_history: history,
      });

      // return the response
      return new Response(res.text);
    } catch (error) {
      // Log the error for debugging
      console.error(error);

      // Return a generic error message to the client
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

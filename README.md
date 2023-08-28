# Cloudflare Langchain Worker

This repository contains a Cloudflare Worker script that builds an HTTP POST endpoint that will answer questions with a URL using LangchainJS, Cheerio and OpenAI. 

Cloudflare Workers will be free for the first 100,000 requests per day. The only thing you'll pay for is your OpenAI tokens. See OpenAI pricing [here](https://openai.com/pricing). Using the example URL in the script, for every request we'll use about 3,776 tokens for text-embedding-ada-002 and 1,337 tokens for the GPT-3.5 Turbo model. Ada v2 is set at $0.0001 / 1K tokens and GPT-3.5 Turbo is set at $0.0015 / 1K tokens.

## Prerequisites

- Node.js: Make sure you have Node.js 18x installed. You can download it from [here](https://nodejs.org/).
- OpenAI API Key: Make sure you go get your API key at platform.openai.com.
- Cloudflare Account: You'll need a free Cloudflare account for this to work. Sign up [here](https://workers.cloudflare.com/).
- Wrangler: This project uses Cloudflare's Wrangler tool to deploy the worker. If you haven't installed it yet, you can do so using npm:

  ```bash
  npm install -g wrangler

## Setup

1. **Clone the repository**:

    ```bash
    git clone https://github.com/ilsilfverskiold/cloudflare-workers-langchain.git
    cd cloudflare-workers-langchain

2. **Install dependencies**: 

    ```bash
    npm install

3. **Install Wrangler (if you haven't installed it before)**: 

    ```bash
    npm install -g wrangler

4. **Authenticate with Cloudflare**:

    ```bash
    wrangler login

Follow the prompts to authenticate.

5. **Set Up Secrets**: Use Wrangler to create the necessary secrets (you'll access these via the env parameter)

    ```bash
    wrangler secret put OPENAI_API_KEY
    wrangler secret put SECRET_TOKEN

Follow the prompts to enter the values for each secret. If you are having issues after deployment go to your Worker in the Cloudflare dashboard and see Settings --> Variables. Set your env variables here and make sure to encrypt them before you deploy.

6. **Customize the Worker Script**:

- Open src/worker.js in your preferred text editor.
- Modify the URL you want the worker to interact with:

    ```javascript
    const loader = new CheerioWebBaseLoader("url_here");

- Customize the prompt template as needed:

    ```javascript
    const promptTemplate = `
        Help the user code directly with the information you get. You should be able to help the user understand how to use it in their own javascript code.
        Question: {question}. Answer:
	`;

7. **Deploy the Worker**:

- If you want to test it before deploying.

    ```bash
    wrangler dev ./langchain-worker/src/worker.js

- If you want to deploy.

    ```bash
    wrangler deploy ./langchain-worker/src/worker.js

8. **Test it out**:

    ```bash
    curl -X POST [YOUR_WORKER_ENDPOINT_URL] \
     -H "Content-Type: application/json" \
     -H "Authorization: SECRET_TOKEN" \
     -d '{"question": "", "history": ""}'

Remember to set the question to something related to your text or it will have issues answering

## Notes

Storing the embeddings file on Cloudflare would be beneficial for performance and cost savings. You could serialize the embeddings and save them as a value associated with a specific key in Workers KV. Then, before processing the embeddings, you can check if they exist in KV and fetch them if available. This could decrease overall costs. 

We're using text-embedding-ada-002-v2 for the embeddings here which has a cost of $0.0001 per 1,000 tokens. Every request here is using about 3,776 tokens for the URL we've provided. 

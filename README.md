# My ChatGPT style LLM WebApp

Built from scratch using Cursor
Uses ChatGPT APIs

## Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

---

## Python Chat Router

A small Python script (`chat_router.py`) is included to route prompts to different OpenAI models and optionally use Google search. The workflow is:

1. Classify the user prompt using **gpt-4o** into one of `simple`, `reasoning` or `internet_search`.
2. Depending on the classification:
   - `simple` &rarr; call **gpt-4o-mini**.
   - `reasoning` &rarr; call **o4-mini**.
   - `internet_search` &rarr; perform a Google Custom Search and feed the results to **gpt-4o**.

### Prerequisites

- Python 3.8+
- `openai`, `requests` and `python-dotenv` packages (`pip install -r requirements.txt`)
- `.env` file with the following keys:

```
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_custom_search_engine_id
```

(See `.env.example` for a template.)

### Running

```bash
python chat_router.py
```

You will be prompted for input and the script will print the response based on the routing rules described above.

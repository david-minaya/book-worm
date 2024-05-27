# Book Worm

Simple API that uses Gemini to summarize PDF files.

## Getting started

1. Install the dependencies: `npm install`.

2. Create a .env file and add the following env vars:

    ```
    # Gemini api key
    GEMINI_API_KEY=<api_key>

    # JWT secret
    JWT_SECRET=<secret>

    # Database
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=postgres
    DB_PASS=root
    DB_NAME=book_worm
    DB_SYNCHRONIZE=true

    # Test database
    TEST_DB_HOST=localhost
    TEST_DB_PORT=5432
    TEST_DB_USER=postgres
    TEST_DB_PASS=root
    TEST_DB_NAME=book_worm_test
    TEST_DB_SYNCHRONIZE=true
    ```
3. Run the project: `npm run start`.

    The application will run on port 3000 by default: `http://localhost:3000`.

    To open the API specification (Swagger), open the url `http://localhost:3000/api` in the browser.

## How to use the API

1. Create a new user account using the endpoint `auth/signup`. Send a POST request with a body of type json with the fields `email` and `password`. This will respond you with an access token.

2. Add the access token to the Authorization header of the requests, ex. `Authorization: Bearer <TOKEN>`.

3. Upload a PDF to summarize it. Send a POST request to the endpoint `ai/summarize-file`. The body of the request must be of type form-data and containt the field `file` with the PDF file. This endpoint will respond you with a chat object that contain the the summary of the file. The chat object will have two message objects, the first one is the message sent to Gemini and the second one is the response of Gemini with the summary of the file. You can use the id of the chat object to ask different things to Gemini about the file using the endpoint `ai/chats/:id/send-message`.

4. To ask different thing to Gemini related with the file you can use the endpoint `/ai/chats/:id/send-message`. Send a POST request with a body of type json with a field `text` with the message.

5. To get a list of chats, send a GET request to the endpoint `ai/chats`.

6. To get a specific chat with all its messages, send a GET request to the endpoint `ai/chats/:id` with the chat id.

> See the API specification to know more about how to use these endpoints.

## Test the project

- Unit test `npm run test`.
- Integration test `npm run test:e2e`.


## Docker

- To build the docker image, run the command `npm run docker:build`.
- To run the docker container locally, run the command `npm run docker:run`.

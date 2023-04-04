# API Documentation

This API allows you to check the status of a website and get its IP address and uptime percentage. The API takes a URL as input and returns a JSON response containing the status, IP address, and uptime percentage of the website.

## Endpoints

POST /api/analyze
Request:

Body:
url (required): The URL of the website you want to analyze.
Response:

Status: 200 OK
Body:
isUp (boolean): Indicates whether the website is up or not.
ipAddress (string): The IP address of the website.
uptime (number): The uptime percentage of the website.

Error Response:

`Status`: 500 Internal Server Error
`Body`:
`error` (string): The error message.

### Examples

Request:

POST /api/analyze
{
  "url": "https://www.google.com"
}
Response:

```sh
{
  "isUp": true,
  "ipAddress": "172.217.13.68",
  "uptime": 84
}
```

Request:

POST /api/analyze

```sh
{
  "url": "https://www.nonexistentwebsite.com"
}
```

Response:

```sh
{
  "isUp": false,
  "ipAddress": null,
  "uptime": 0
}
```

Note: This API uses the `http`, `https`, `dns`, `express`, `body-parser`, and `url` modules in **Node.js**. The `http` and `https` modules are used to make requests to the website, the `dns` module is used to look up the IP address of the website, the `express` module is used to create the server and handle requests, the `body-parser` module is used to parse the request body, and the `url` module is used to parse the URL of the website. The API listens on `port 5000` by default but can be configured using the `PORT` environment variable.

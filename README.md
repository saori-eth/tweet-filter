# Tweet Filter

Transform and post tweets with AI-powered character personalities. This TypeScript app takes draft tweet text, rewrites it using a character's unique voice and style via OpenAI's GPT-4o-mini, and posts it through X's API.

## Prerequisites

- Node.js 18+ and pnpm
- OpenAI API key
- X/Twitter Developer account with v2 API access (OAuth 1.0a credentials)

## Setup

1.  **Clone and install:**

    ```bash
    git clone <your-repo-url>
    cd tweet-filter
    pnpm install
    ```

2.  **Set up environment variables:**
    ```bash
    cp .env.example .env
    ```
    Then, edit `.env` with your API credentials.

## Usage

The main script is `src/main.ts`, which can be run via `pnpm dev` (using `ts-node`) or by building the project first.

### Common Commands

- **Transform and post a tweet:**

  ```bash
  pnpm dev --character techie "Just shipped a new feature!"
  ```

- **See the transformation without posting (dry run):**

  ```bash
  pnpm dev --dry-run --character techie "This is a test tweet."
  ```

- **List available built-in characters:**

  ```bash
  pnpm dev --list-characters
  ```

- **Use a custom character definition:**
  ```bash
  pnpm dev --character ./path/to/my-character.json "My custom tweet"
  ```

### CLI Options

| Flag                 | Description                                        |
| -------------------- | -------------------------------------------------- |
| `--character <name>` | **Required.** Character name or path to JSON file. |
| `--dry-run`          | Transform but do not post to Twitter.              |
| `--list-characters`  | Show available built-in characters.                |
| `--verbose`, `-v`    | Show detailed output.                              |
| `--help`, `-h`       | Show the help message.                             |

## Development

- **Run tests:**

  ```bash
  pnpm test
  ```

- **Lint and format:**
  ```bash
  pnpm lint
  pnpm format
  ```

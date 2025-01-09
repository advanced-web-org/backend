<p align="center"><h1 align="center">MuoiBa Bank Backend</h1></p>
<p align="center">
	<img src="https://img.shields.io/github/license/advanced-web-org/backend?style=default&logo=opensourceinitiative&logoColor=white&color=0080ff" alt="license">
	<img src="https://img.shields.io/github/last-commit/advanced-web-org/backend?style=default&logo=git&logoColor=white&color=0080ff" alt="last-commit">
	<img src="https://img.shields.io/github/languages/top/advanced-web-org/backend?style=default&color=0080ff" alt="repo-top-language">
	<img src="https://img.shields.io/github/languages/count/advanced-web-org/backend?style=default&color=0080ff" alt="repo-language-count">
</p>
<p align="center"><!-- default option, no dependency badges. -->
</p>
<p align="center">
	<!-- default option, no dependency badges. -->
</p>
<br>

---

## Table of Contents

- [ Project Structure](#-project-structure)
- [ Getting Started](#-getting-started)
  - [ Prerequisites](#-prerequisites)
  - [ Installation](#-installation)
  - [ Usage](#-usage)

---

## Project Structure

```sh
└── backend/
    ├── README.md
    ├── docker-compose.yml
    ├── fake-client.ts
    ├── nest-cli.json
    ├── package.json
    ├── pgp-keys
    │   ├── private.asc
    │   ├── public.asc
    │   └── public1.asc
    ├── pnpm-lock.yaml
    ├── prisma
    │   ├── migrations
    │   └── schema.prisma
    ├── rsa-keys
    │   ├── private.pem
    │   ├── private1.pem
    │   ├── public.pem
    │   └── public1.pem
    ├── src
    │   ├── accounts
    │   ├── app.controller.ts
    │   ├── app.module.ts
    │   ├── app.service.ts
    │   ├── auth
    │   ├── bank
    │   ├── beneficiaries
    │   ├── customers
    │   ├── debts
    │   ├── deposit
    │   ├── kafka
    │   ├── mailer
    │   ├── main.ts
    │   ├── middleware
    │   ├── notification
    │   ├── otp
    │   ├── partner
    │   ├── prisma.service.ts
    │   ├── staffs
    │   ├── transaction
    │   └── users
    ├── start-all.sh
    ├── test
    │   ├── app.e2e-spec.ts
    │   └── jest-e2e.json
    ├── tsconfig.build.json
    └── tsconfig.json
```

## Getting Started

### Prerequisites

Before getting started with backend, ensure your runtime environment meets the following requirements:

- **Programming Language:** TypeScript
- **Package Manager:** Npm
- **Container Runtime:** Docker

### Installation

1. Clone the backend repository:

```sh
❯ git clone https://github.com/advanced-web-org/backend
```

2. Navigate to the project directory:

```sh
❯ cd backend
```

3. Install the project dependencies:

**Using `npm`** &nbsp; [<img align="center" src="https://img.shields.io/badge/npm-CB3837.svg?style={badge_style}&logo=npm&logoColor=white" />](https://www.npmjs.com/)

```sh
❯ npm install

❯ docker-compose up -d
```

### Usage

Run backend using the following command:
**Using `npm`** &nbsp; [<img align="center" src="https://img.shields.io/badge/npm-CB3837.svg?style={badge_style}&logo=npm&logoColor=white" />](https://www.npmjs.com/)

```sh
❯ npm start
```

Using `sh` script:

```sh
❯ sh start-all.sh
```

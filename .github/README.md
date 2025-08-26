<div align="center">

  <a href="https://github.com/parazeeknova/zephyr">
    <img src="https://pub-76b24982501b430f872cc299cad80a7f.r2.dev/Assets/zephyr-githubanner.jpg" alt="Banner" width="90%"/>
  </a>
</div>
<br>
<br>

<div align="center">

  <a href="#-local-development-setup"><kbd> <br> Development <br> </kbd></a>&ensp;&ensp;
  <a href="https://github.com/parazeeknova/zephyr/blob/main/.github/CONTRIBUTING.md"><kbd> <br> Contributing <br> </kbd></a>&ensp;&ensp;
  <a href="https://github.com/parazeeknova/zephyr/wiki"><kbd> <br> Wiki (OLD) <br> </kbd></a>&ensp;&ensp;
  <a href="https://github.com/parazeeknova/zephyr/issues"><kbd> <br> Roadmap <br> </kbd></a>&ensp;&ensp;
  <a href="https://github.com/singularityworks-xyz"><kbd> <br> Singularity Works <br> </kbd></a>&ensp;&ensp;
  <a href="#-troubleshooting"><kbd> <br> Troubleshoot <br> </kbd></a>&ensp;&ensp;

</div>

#### _<div align="left"><sub>// About 🌿</sub></div>_

Zephyr is a next-generation social platform designed for seamless interaction, privacy, and speed. Built with modern web technologies, Zephyr redefines how users connect, share, and engage in a clutter-free digital space. Whether it's real-time conversations, media sharing, or a smooth user experience, Zephyr is crafted for the future of social networking. 

|  |  |
| -- | -- |
| **About Zephyr**<br><br>- Aggregate social posts in one place<br>- Open Source & contributor friendly<br>- Supports diverse file formats<br>- Bookmark posts from other platforms<br>- Earn & grow Aura (reputation / token system) | <img src="https://pub-76b24982501b430f872cc299cad80a7f.r2.dev/Assets/zephyr-logo.png" alt="Zephyr Logo" width="25%"/> |
| <img src="https://pub-76b24982501b430f872cc299cad80a7f.r2.dev/Assets/zeph.png" alt="Zeph AI Logo" width="25%"/> | **Zeph AI (WIP)**<br><br>- Context‑aware assistant mascot<br>- Chat + post generation & refinement<br>- Smart summaries & replies<br>- Helpful guidance & interactions |

#### _<div align="left"><sub>// Rebranding & Info 🦕</sub></div>_
With Zephyr's rebranding from Singularity Works, we are excited to announce a renewed focus on enhancing user experience.

> [!WARNING]
> As we are transitioning, services and features may be temporarily unavailable. We appreciate your patience and understanding during this period.

btw here are some cool artworks for our collaboration:

<p align="center">
  <img src="https://pub-76b24982501b430f872cc299cad80a7f.r2.dev/Assets/singxzephyr-banner.jpg"
      alt="Singularity Works × Zephyr collaboration artwork" width="80%">
  <img src="https://pub-76b24982501b430f872cc299cad80a7f.r2.dev/Assets/singxzep-github-banner.jpg"
      alt="Zephyr atmospheric artwork" width="80%"><br>
  <sub><em>Artwork by the Singularity Works team</em></sub>
</p>
<br>

#### _<div align="left"><sub>// Local Development Setup 📐</sub></div>_

> [!NOTE]
> **Zephyr** is a monorepo project, which means that it is composed of multiple packages that are managed together. The project uses [pnpm](https://pnpm.io/) for workspace management and [Docker](https://www.docker.com/) for containerization. Make sure you have the following prerequisites installed before setting up the development environment.

###### _<div align="center"><sub>Manual Installation</sub></div>_

```bash
# 1. Clone the repository
git clone https://github.com/zephyr.git && cd zephyr

# 1.5 For Automatic setup (This will install packages, format using ultracite & setup local .env files and start init docker containers)
pnpm run dev:aio

# Manual setup
# 2. Install the dependencies
pnpm install # (skip if you ran: dev:aio)

# 3. First time setup or after clean
# This will start required containers and run migration containers required for prisma schema & minio buckets
pnpm run docker:dev # (skip if you ran: dev:aio)
# Clean everything and start fresh if you encounter any issues
pnpm run docker:clean:dev && pnpm run docker:dev

# 3.5 (Optional) Run the migrations manually
pnpm run docker:dev-noinit # This will start the required services without running the migrations
cd packages/db && pnpm prisma generate && pnpm prisma db push
# For minio buckets, create the following buckets from the MinIO console at http://localhost:9001 
`uploads`, `temp`, `backups`

# 4. Start the development containers if not already started (optional)
pnpm run docker:start # (optional if you want to start the containers manually)

# 5. Setup the environment variables automatically
pnpm run env:local # (skip if you ran: dev:aio)

# Set `.env` variables form `.env.example` file manually (optional if you want auth and other services)
cp .env.example .env # Unix/Linux/Mac
copy .env.example .env # Windows
# Read the `.env.example` file for more information
# Some useful commands are:
pnpm run env:validate # Validate the environment variables

# 6. Prisma migrations
pnpm run prisma:up # (skip if you ran: dev:aio)

# 6. Start the development server
pnpm turbo dev
# or
turbo dev

# TIP ⚠️ : Check package.json for more scripts in the root directory
# If you encounter any issues, refer to the troubleshooting section below or report the issue on the Issues page
```

<!-- ###### _<div align="center"><sub>Using Zephyr Forge (deprecated) ⚠️</sub></div>_

> [!WARNING]
> **Zephyr Forge** is deprecated and no longer maintained. It is recommended to use the manual installation process for setting up the development environment.

[Zephyr Forge](https://github.com/parazeeknova/zephyr-forge) is a powerful utility designed to streamline the setup process for Zephyr development environments. It automates the entire configuration process, handling everything from dependency checks to Docker container management.

<div align="center">

```bash
bunx zephyr-forge@latest setup
```

</div> -->

#### What a sucessful docker setup looks like after running ```pnpm run docker:dev```:

<div align="center">

  <img src="https://github.com/parazeeknova/zephyr/blob/main/.github/assets/docker.png?raw=true" alt="Docker setup" width="95%"/>

</div>

###### _<div align="left"><sub>// Ports:</sub></div>_
If everything goes well, you should be able to access the following services:

- Next.js: http://localhost:3000
- PostgreSQL: http://localhost:5433
- Redis: http://localhost:6379
- MinIO Console: http://localhost:9001 or http://localhost:9000

<!-- #### _<div align="left"><sub>// Screenshots</sub></div>_

|                    Homepage                     |                      Notifications                       |                    Bookmarks                     |
| :---------------------------------------------: | :------------------------------------------------------: | :----------------------------------------------: |
| ![homepage](./assets//screenshots/homepage.png) | ![notifications](./assets/screenshots/notifications.png) | ![bookamrks](./assets/screenshots/bookmarks.png) |

|                   Profile                    |                    Chat                    |                  Users                   |
| :------------------------------------------: | :----------------------------------------: | :--------------------------------------: |
| ![profile](./assets/screenshots/profile.png) | ![settings](./assets/screenshots/chat.png) | ![users](./assets/screenshots/users.png) | -->

#### _<div align="left"><sub>// Troubleshooting 🍋‍🟩</sub></div>_

###### _<div align="left"><sub>// pre commit hooks</sub></div>_

If you encounter any issues with the pre-commit hooks, try running the following commands:

```bash
# Ensure that your code is formatted and linted
pnpm run lint && pnpm run format
```
or just skip git hooks.

If you encounter any issues with the development setup, try the following steps:

###### _<div align="left"><sub>// Database</sub></div>_

If you encounter any issues with Prisma or the migrations failed, try running the following commands:

```bash
# Navigate to the db package
cd packages/db

# Run the following commands
pnpm prisma generate
pnpm prisma db push
```

###### _<div align="left"><sub>// Minio 🦩</sub></div>_

If you encounter any issues with Minio or the buckets are not created, try the following steps:

```bash
# Ensure MinIO is running
Access MinIO Console at http://localhost:9001
# Login with default credentials:
Username: minioadmin
Password: minioadmin

```
Create the following uploads bucket manually from the MinIO console

If you still encounter any issues with the development server, report the issue on the [Issues](https://github.com/parazeeknova/zephyr/issues) page.

#### _<div align="left"><sub>// Contributors</sub></div>_

<br>
<a href="https://github.com/parazeeknova/zephyr/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=parazeeknova/zephyr" />
</a>

#### _<div align="left"><sub>// Analytics 📊</sub></div>_
![Alt](https://repobeats.axiom.co/api/embed/21d8d944036757fcd0624e71d0b2598ca8b8041f.svg "Repobeats analytics image")

<div align="center">
  <a href="https://devsocial.zephyyrr.in">
    <img src="https://raw.githubusercontent.com/parazeeknova/nyxtext-zenith/f4ef877c1ac8c4a5b393a19a086bec2d379b3916/.github/assets/misc/catppuccin_cat.svg" alt="Catppuccino Cat">
  </a>
</div>

<br>
<br>

#### _<div align="left"><sub>// Our Services 🚀</sub></div>_

<table align="center">
  <tr>
    <td align="center">
      <a href="https://devsocial.zephyyrr.in">
        <img src="https://pub-76b24982501b430f872cc299cad80a7f.r2.dev/Assets/zephyr-logo.png" alt="Zephyr Logo" width="80px"/><br>
        <strong>Zephyr</strong><br>
        <sub>Social media aggregator</sub>
      </a>
    </td>
    <td align="center">
      <a href="https://devsocial.zephyyrr.in">
        <img src="https://pub-76b24982501b430f872cc299cad80a7f.r2.dev/Assets/zeph.png" alt="Zeph AI" width="80px"/><br>
        <strong>Zeph AI (WIP)</strong><br>
        <sub>Your Companion for Zephyr</sub>
      </a>
    </td>
    <td align="center">
      <a href="https://devsocial.zephyyrr.in">
        <img src="https://pub-76b24982501b430f872cc299cad80a7f.r2.dev/Assets/chat.png" alt="Zephara" width="80px"/><br>
        <strong>Zephara (WIP)</strong><br>
        <sub>Chat for Zephyr</sub>
      </a>
    </td>
  </tr>
</table>

##### *<div align="center"><sub>Copyright © 2025 Parazeeknova</sub></div>*

<p align="center">
<strong>Zephyr</strong> is licensed under the <a href="https://github.com/parazeeknova/zephyr/blob/main/LICENSE">AGPL License</a>.
</p>


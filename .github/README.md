<div align="center">

  <a href="https://github.com/zephverse/zephyr">
    <img src="https://storage-r2.zephyyrr.in/Assets/zephyr-githubanner.jpg" alt="Zephyr Banner" width="90%"/>
  </a>
</div>
<br>
<br>

<div align="center">

  <a href="#-local-development-setup"><kbd> <br> Development <br> </kbd></a>&ensp;&ensp;
  <a href="https://github.com/zephverse/zephyr/blob/main/.github/CONTRIBUTING.md"><kbd> <br> Contributing <br> </kbd></a>&ensp;&ensp;
  <a href="https://github.com/zephverse/zephyr/issues"><kbd> <br> Roadmap <br> </kbd></a>&ensp;&ensp;
  <a href="https://github.com/singularityworks-xyz"><kbd> <br> Singularity Works <br> </kbd></a>&ensp;&ensp;
  <a href="#-troubleshooting"><kbd> <br> Troubleshoot <br> </kbd></a>&ensp;&ensp;

</div>

#### _<div align="left"><sub>// About 🌿</sub></div>_

Zephyr is a social platform designed for seamless interaction, privacy, and speed. Built with modern web technologies, Zephyr redefines how users connect, share, and engage in a clutter-free digital space. Whether it's real-time conversations, media sharing, or a smooth user experience, Zephyr is crafted for the future of social networking.

|  |  |
| -- | -- |
| **About Zephyr**<br><br>- Aggregate social posts in one place<br>- Open Source & contributor friendly<br>- Supports diverse file formats<br>- Bookmark posts from other platforms<br>- Earn & grow Aura (reputation / token system) | <img src="https://storage-r2.zephyyrr.in/Assets/zephyr-logo.png" alt="Zephyr Logo" width="30%"/> |
| <img src="https://storage-r2.zephyyrr.in/Assets/zeph.png" alt="Zeph AI Logo" width="30%"/> | **Zeph AI (WIP)**<br><br>- Context‑aware assistant mascot<br>- Chat + post generation & refinement<br>- Smart summaries & replies<br>- Helpful guidance & interactions |

#### _<div align="left"><sub>// Rebranding & Info 🦕</sub></div>_
With Zephyr's enhancement from Singularity Works, we are excited to announce a renewed focus on enhancing user experience & performance.

btw here are some cool artworks for our collaboration:

<p align="center">
  <img src="https://storage-r2.zephyyrr.in/Assets/singxzephyr-banner.jpg"
      alt="Singularity Works × Zephyr collaboration artwork" width="80%">
  <!-- <img src="https://storage-r2.zephyyrr.in/Assets/singxzep-github-banner.jpg"
      alt="Zephyr atmospheric artwork" width="80%"> -->
  <br>
  <sub><em>Artwork by the Singularity Works team</em></sub>
</p>
<br>

#### _<div align="left"><sub>// Local Development Setup 📐</sub></div>_

> [!NOTE]
> **Zephyr** is a monorepo project, which means that it is composed of multiple packages that are managed together. The project uses [bun](https://bun.sh/) for workspace management and [Docker](https://www.docker.com/) for containerization. Make sure you have the following prerequisites installed before setting up the development environment.

###### _<div align="center"><sub>Manual Installation</sub></div>_

```bash
# 1. Clone the repository
git clone https://github.com/zephverse/zephyr && cd zephyr

# 2. Install the dependencies
bun install

# 3. First time setup or after clean
# This will start required containers and run migration containers required for prisma schema & minio buckets
bun run docker:dev
# Clean everything and start fresh if you encounter any issues
bun run docker:clean && bun run docker:dev

# 4. Setup the environment variables automatically
bun run env:dev

# 5. Start the development server
bun run dev
# or
turbo dev

# If you encounter any issues, refer to the troubleshooting section below or report the issue on the Issues page
```

#### What a sucessful docker setup looks like after running ```bun run docker:dev```:

<div align="center">

  <img src="https://github.com/zephverse/zephyr/blob/main/.github/assets/docker.png?raw=true" alt="Docker setup" width="95%"/>

</div>

###### _<div align="left"><sub>// Ports:</sub></div>_
If everything goes well, you should be able to access the following services:

- Zephyr web: http://localhost:3000
- Zephyr auth: http://localhost:3001
- PostgreSQL: http://localhost:5433
- Redis: http://localhost:6379
- RedisInsight: http://localhost:5540
- Prisma Studio: http://localhost:5555
- MinIO Console: http://localhost:9001

#### _<div align="left"><sub>// Troubleshooting 🍋‍🟩</sub></div>_

###### _<div align="left"><sub>// pre commit hooks</sub></div>_

If you encounter any issues with the pre-commit hooks, try running the following commands:

```bash
# Ensure that your code is formatted and linted
bun run check
```

If you encounter any issues with the development setup, try the following steps:

###### _<div align="left"><sub>// Database</sub></div>_

If you encounter any issues with Prisma or the migrations failed, try running the following commands:

```bash
# Navigate to the db package
cd packages/db && bun prisma generate
```

If you still encounter any issues with the development server, report the issue on the [Issues](https://github.com/zephverse/zephyr/issues) page.

#### _<div align="left"><sub>// Contributors</sub></div>_

<br>
<a href="https://github.com/zephverse/zephyr/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=zephverse/zephyr" />
</a>

<br>
<br>

#### _<div align="left"><sub>// Our Services 🚀</sub></div>_

<table align="center">
  <tr>
    <td align="center">
      <a href="https://zephyyrr.in">
        <img src="https://storage-r2.zephyyrr.in/Assets/zephyr-logo.png" alt="Zephyr Logo" width="80px"/><br>
        <strong>Zephyr</strong><br>
        <sub>Social media aggregator</sub>
      </a>
    </td>
    <td align="center">
      <a href="https://zephyyrr.in">
        <img src="https://storage-r2.zephyyrr.in/Assets/zeph.png" alt="Zeph AI" width="80px"/><br>
        <strong>Zeph AI (WIP)</strong><br>
        <sub>Your Companion for Zephyr</sub>
      </a>
    </td>
  </tr>
</table>

##### *<div align="center"><sub>Copyright © 2025 Parazeeknova</sub></div>*

<p align="center">
<strong>Zephyr</strong> is licensed under the <a href="https://github.com/zephverse/zephyr/blob/main/LICENSE">AGPL License</a>.
</p>



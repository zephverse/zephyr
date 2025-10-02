import { env } from "../../env";

export const emailConfig = {
  company: {
    name: "Zephyr",
    website: env.NEXT_PUBLIC_SITE_URL,
    supportEmail: env.SUPPORT_EMAIL,
  },

  assets: {
    backgroundImage: `${env.NEXT_PUBLIC_SITE_URL}/assets/auth/signup-image.jpg`,
    colors: {
      primary: "#f97316",
      primaryHover: "#fb923c",
      secondary: "#1f2937",
      text: "#6b7280",
      textDark: "#1f2937",
      textLight: "#9ca3af",
      border: "#e5e7eb",
      warning: "#9a3412",
      warningBg: "#fff7ed",
      warningBorder: "#ffedd5",
      cardBg: "#f8fafc",
    },
    features: [
      {
        emoji: "🌐 ",
        title: "Unified Social Feed",
        description:
          "Experience all your social media in one place. Zephyr seamlessly aggregates content from Twitter, Reddit, 4chan, and more into a single, customizable feed. No more platform hopping!",
      },
      {
        emoji: "⚡ ",
        title: "Streamlined Experience",
        description:
          "Take control of your social media consumption with powerful filters, custom categories, and real-time updates. Save time and never miss important content from your favorite platforms.",
      },
      {
        emoji: "🐙 ",
        title: "Open Source Freedom",
        description:
          "Zephyr is proudly Free and Open Source Software (FOSS). Inspect the code, suggest features, contribute improvements, and help build a more connected social media experience for everyone. More eyes make for better software!",
      },
    ],
  },

  social: {
    github: {
      url: "https://github.com/parazeeknova/zephyr",
      icon: "https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png",
    },
    discord: {
      url: "https://discordapp.com/users/parazeeknova",
      icon: "https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/636e0a69f118df70ad7828d4_icon_clyde_blurple_RGB.svg",
    },
  },

  legal: {
    privacy: {
      url: `${env.NEXT_PUBLIC_SITE_URL}/privacy`,
      text: "Privacy Policy",
    },
    terms: {
      url: `${env.NEXT_PUBLIC_SITE_URL}/toc`,
      text: "Terms of Service",
    },
    unsubscribe: {
      url: `${env.NEXT_PUBLIC_SITE_URL}/soon`,
      text: "Unsubscribe",
    },
  },

  templates: {
    verification: {
      subject: "🎉 One Last Step to Join the Zephyr Community!",
      buttonText: "Verify Email Address",
      expiryTime: "1 hour",
    },
    passwordReset: {
      subject: "Reset Your Password",
      buttonText: "Reset Password",
      expiryTime: "1 hour",
    },
  },

  project: {
    description:
      "Zephyr is a social media aggregator that aggregates content from various social media platforms and displays them in a single feed. Completely FOSS and open to contributions.",
    stats: {
      stars: "⭐ Star on GitHub",
      contribute: "🛠️ Contribute",
      community: "👥 Join Community",
    },
    links: {
      repo: "https://github.com/parazeeknova/zephyr",
      contribute: "https://github.com/parazeeknova/zephyr/contribute",
      discord: "https://discordapp.com/users/parazeeknova",
    },
  },
};

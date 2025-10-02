export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="mb-4 font-bold text-4xl">Zephyr Auth Service</h1>
        <p className="mb-8 text-lg">Better Auth with tRPC runtime host</p>

        <div className="rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
          <h2 className="mb-4 font-semibold text-2xl">Available Endpoints</h2>
          <ul className="space-y-2">
            <li>
              <code className="rounded bg-gray-200 px-2 py-1 dark:bg-gray-700">
                POST/GET /api/auth/*
              </code>
              {" - Better Auth endpoints"}
            </li>
            <li>
              <code className="rounded bg-gray-200 px-2 py-1 dark:bg-gray-700">
                POST/GET /api/trpc/*
              </code>
              {" - tRPC endpoints"}
            </li>
          </ul>
        </div>

        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="mb-2 font-semibold text-lg">OAuth Providers</h3>
          <ul className="list-inside list-disc space-y-1">
            <li>Google OAuth</li>
            <li>GitHub OAuth</li>
            <li>Discord OAuth</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

// Synthetic, private in-memory storage for tests only. No credentials or live data.
export function memoryBlob(initial = {}, pageSize = 1000) {
  const records = new Map(
    Object.entries(initial).map(([path, record]) => [
      path,
      JSON.stringify(record),
    ]),
  );
  const writes = [];
  return {
    records,
    writes,
    async put(path, raw, options) {
      if (options.allowOverwrite === false && records.has(path))
        throw new Error("Already exists");
      records.set(path, raw);
      writes.push([path, raw, options]);
      return { pathname: path };
    },
    async get(path) {
      return records.has(path)
        ? { statusCode: 200, stream: new Response(records.get(path)).body }
        : null;
    },
    async list({ prefix = "", mode, cursor }) {
      const paths = [...records.keys()]
        .filter((path) => path.startsWith(prefix))
        .sort();
      const entries =
        mode === "folded"
          ? [
              ...new Set(
                paths.map((path) => {
                  const suffix = path.slice(prefix.length);
                  return suffix.includes("/")
                    ? prefix + suffix.split("/")[0] + "/"
                    : path;
                }),
              ),
            ].sort()
          : paths;
      const start = Number(cursor || 0);
      const page = entries.slice(start, start + pageSize);
      const hasMore = start + pageSize < entries.length;
      return {
        blobs: page
          .filter((path) => mode !== "folded" || !path.endsWith("/"))
          .map((path) => ({ pathname: path, url: path })),
        folders:
          mode === "folded" ? page.filter((path) => path.endsWith("/")) : [],
        hasMore,
        cursor: hasMore ? String(start + pageSize) : undefined,
      };
    },
  };
}

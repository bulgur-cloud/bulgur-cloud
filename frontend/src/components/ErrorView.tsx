import { BError } from "@/utils/error";

export function ErrorView({ error }: { error: BError }) {
  return (
    <div>
      <h1 className="text-2xl">{error.title}</h1>
      <p>{error.description}</p>
      <p>
        Please share the following text with your server admin. If you are the
        server admin, please investigate the error best you can and file a bug
        report!
      </p>
      <pre className="border border-error-content my-4 p-4">{error.code}</pre>
    </div>
  );
}

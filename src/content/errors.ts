/** A post that cannot be published as written, named by its file. */
export class ContentError extends Error {
  constructor(file: string, message: string, options?: ErrorOptions) {
    super(`${file}: ${message}`, options);
    this.name = "ContentError";
  }
}

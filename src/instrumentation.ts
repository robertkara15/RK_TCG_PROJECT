export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { bootstrapOwnerIfNeeded } = await import("@/lib/bootstrap");
    await bootstrapOwnerIfNeeded();
  }
}

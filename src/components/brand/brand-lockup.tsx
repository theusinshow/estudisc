import Image from "next/image";

/** Estudisc lockup: the vector-V mark plus a live wordmark, so the name uses the product typeface. */
export function BrandLockup({ priority = false }: Readonly<{ priority?: boolean }>) {
  return (
    <span className="brand-lockup">
      <Image src="/branding/estudisc-mark.svg" alt="" width={64} height={64} priority={priority} />
      <span className="brand-word">Estudisc</span>
    </span>
  );
}

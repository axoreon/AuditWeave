import Image from "next/image";

export const AUDITWEAVE_LOGO_SRC = "/auditweave-logo.jpeg";

type BrandLogoProps = {
  size: number;
  alt?: string;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  size,
  alt = "AuditWeave logo",
  className = "",
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src={AUDITWEAVE_LOGO_SRC}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-md object-contain ${className}`}
      priority={priority}
    />
  );
}

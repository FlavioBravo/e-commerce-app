import Image from "next/image";

const artwork = [
  "/media/product-0.webp",
  "/media/product-1.webp",
  "/media/product-2.webp",
  "/media/product-3.webp",
  "/media/product-4.webp",
  "/media/product-5.webp",
  "/media/product-6.webp",
  "/media/product-7.webp",
] as const;

const ARTWORK_SIZE = 800;

type Props = {
  label: string;
  sizes: string;
  className?: string;
};

/**
 * Decorative category image. The files are 800×800 WebP and load lazily.
 * The product name sits beside the image, so the image itself has no alt text.
 */
export function ProductMedia({ label, sizes, className = "" }: Props) {
  const src = artwork[hash(label) % artwork.length];
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt=""
        width={ARTWORK_SIZE}
        height={ARTWORK_SIZE}
        sizes={sizes}
        loading="lazy"
        className="h-full w-full object-cover"
      />
      <span className="absolute bottom-4 left-5 text-6xl font-semibold tracking-tight text-ink/30">
        {label.slice(0, 1).toUpperCase()}
      </span>
    </div>
  );
}

function hash(value: string): number {
  let total = 0;
  for (const char of value) total = (total * 33 + char.charCodeAt(0)) >>> 0;
  return total;
}

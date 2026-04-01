import Image from "next/image";

type EntityMediaFrameProps = {
  src: string;
  alt: string;
  title?: string | null;
  width?: number | null;
  height?: number | null;
  variant?: "card" | "section" | "hero" | "full";
};

function getAspectRatio(width?: number | null, height?: number | null) {
  if (!width || !height) {
    return undefined;
  }

  return `${width} / ${height}`;
}

function getDimensions(width?: number | null, height?: number | null) {
  if (width && height) {
    return { width, height };
  }

  return { width: 1600, height: 900 };
}

export function EntityMediaFrame({
  src,
  alt,
  title,
  width,
  height,
  variant = "card",
}: EntityMediaFrameProps) {
  const aspectRatio = getAspectRatio(width, height);
  const dimensions = getDimensions(width, height);

  if (variant === "hero") {
    return (
      <div className="border-b border-border/60 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex justify-center overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-3 sm:p-4">
          <Image
            src={src}
            alt={alt || title || ""}
            width={dimensions.width}
            height={dimensions.height}
            sizes="(min-width: 1024px) 960px, 100vw"
            className="block max-h-[70vh] max-w-full object-contain"
            style={aspectRatio ? { aspectRatio, width: "auto", height: "auto" } : { width: "auto", height: "auto" }}
          />
        </div>
      </div>
    );
  }

  if (variant === "section") {
    return (
      <div className="border-b border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] px-4 py-4">
        <div className="flex justify-center overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-3">
          <Image
            src={src}
            alt={alt || title || ""}
            width={dimensions.width}
            height={dimensions.height}
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="block max-h-[32rem] max-w-full object-contain"
            style={aspectRatio ? { aspectRatio, width: "auto", height: "auto" } : { width: "auto", height: "auto" }}
          />
        </div>
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className="mt-5 overflow-hidden rounded-2xl border border-border/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-3">
        <Image
          src={src}
          alt={alt || title || ""}
          width={dimensions.width}
          height={dimensions.height}
          sizes="(min-width: 1024px) 720px, 100vw"
          className="block w-full rounded-xl object-contain"
          style={aspectRatio ? { aspectRatio, width: "100%", height: "auto" } : { width: "100%", height: "auto" }}
        />
      </div>
    );
  }

  return (
    <div className="border-b border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] px-3 py-3">
      <div className="flex justify-center overflow-hidden rounded-xl border border-border/40 bg-background/50 p-2">
        <Image
          src={src}
          alt={alt || title || ""}
          width={dimensions.width}
          height={dimensions.height}
          sizes="(min-width: 768px) 50vw, 100vw"
          className="block max-h-64 max-w-full object-contain"
          style={aspectRatio ? { aspectRatio, width: "auto", height: "auto" } : { width: "auto", height: "auto" }}
        />
      </div>
    </div>
  );
}

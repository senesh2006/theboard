import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type ListingCardProps = {
  listing: {
    id: string;
    title: string;
    description: string;
    district: string | null;
    isRemote: boolean;
    isPartTime: boolean;
    skillsRequired: string[];
    createdAt: Date;
    poster: { name: string };
  };
};

export function ListingCard({ listing }: ListingCardProps) {
  const excerpt =
    listing.description.length > 140
      ? `${listing.description.slice(0, 140)}…`
      : listing.description;

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <div className="mb-3 flex flex-wrap gap-2">
        {listing.isRemote ? <Badge>Remote</Badge> : null}
        {listing.isPartTime ? <Badge variant="success">Part-time</Badge> : null}
        {listing.district ? <Badge variant="muted">{listing.district}</Badge> : null}
      </div>
      <Link href={`/listings/${listing.id}`} className="group">
        <h2 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-700">
          {listing.title}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{excerpt}</p>
      </Link>
      {listing.skillsRequired.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {listing.skillsRequired.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : null}
      <p className="mt-auto pt-4 text-xs text-slate-500">
        Posted by {listing.poster.name} ·{" "}
        {new Date(listing.createdAt).toLocaleDateString()}
      </p>
    </Card>
  );
}

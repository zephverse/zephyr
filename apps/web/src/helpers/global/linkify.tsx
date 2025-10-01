import Link from "next/link";
import type React from "react";
import { LinkIt, LinkItUrl } from "react-linkify-it";
import UserLinkWithTooltip from "@/components/Layouts/user-link-with-tooltip";

type LinkifyProps = {
  children: React.ReactNode;
};
const usernameRegex = /(@[a-zA-Z0-9_-]+)/;
const hashtagRegex = /(#[a-zA-Z0-9]+)/;

export default function Linkify({ children }: LinkifyProps) {
  return (
    <LinkifyUsername>
      <LinkifyHashtag>
        <LinkifyUrl>{children}</LinkifyUrl>
      </LinkifyHashtag>
    </LinkifyUsername>
  );
}

function LinkifyUrl({ children }: LinkifyProps) {
  return (
    <LinkItUrl className="text-primary hover:underline">{children}</LinkItUrl>
  );
}

function LinkifyUsername({ children }: LinkifyProps) {
  return (
    <LinkIt
      component={(match, key) => (
        <UserLinkWithTooltip key={key} username={match.slice(1)}>
          {match}
        </UserLinkWithTooltip>
      )}
      regex={usernameRegex}
    >
      {children}
    </LinkIt>
  );
}

function LinkifyHashtag({ children }: LinkifyProps) {
  return (
    <LinkIt
      component={(match, key) => (
        <Link
          className="text-primary hover:underline"
          href={`/hashtag/${match.slice(1)}`}
          key={key}
        >
          {match}
        </Link>
      )}
      regex={hashtagRegex}
    >
      {children}
    </LinkIt>
  );
}

import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useGT } from "gt-tanstack-start";
import { Message } from "#app/components/site/Message";
import { PlinthButton, PlinthLink } from "#app/components/ui/Plinth";

export function ErrorPage({ reset }: ErrorComponentProps) {
  const router = useRouter();
  const gt = useGT();
  return (
    <Message code="500" title={gt("Something broke on our side")}>
      <p>{gt("Try again in a moment. If it keeps happening, tell us on Discord.")}</p>
      <div>
        <PlinthButton
          onClick={() => {
            reset();
            void router.invalidate();
          }}
        >
          {gt("Try again")}
        </PlinthButton>
        <PlinthLink tone="ink" to="/">
          {gt("Home")}
        </PlinthLink>
      </div>
    </Message>
  );
}

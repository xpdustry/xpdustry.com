import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { T, useGT } from "gt-tanstack-start";
import { PlinthButton, PlinthLink } from "#app/ui/Plinth";
import { Message } from "./Message";

export function ErrorPage({ reset }: ErrorComponentProps) {
  const router = useRouter();
  const gt = useGT();
  return (
    <Message code="500" title={gt("Something broke on our side")}>
      <p>
        <T>Try again in a moment. If it keeps happening, tell us on Discord.</T>
      </p>
      <div>
        <PlinthButton
          onClick={() => {
            reset();
            void router.invalidate();
          }}
        >
          <T>Try again</T>
        </PlinthButton>
        <PlinthLink tone="ink" to="/">
          <T>Home</T>
        </PlinthLink>
      </div>
    </Message>
  );
}

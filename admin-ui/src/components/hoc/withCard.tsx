import type { ComponentType } from "react";
import { Card, CardContent } from "@mui/material";

export function withCard<P extends object>(Component: ComponentType<P>) {
  return function CardWrappedComponent(props: P) {
    return (
      <Card>
        <CardContent>
          <Component {...props} />
        </CardContent>
      </Card>
    );
  };
}

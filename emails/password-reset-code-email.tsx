import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import { getEmailBrandUrl } from "@/lib/email-brand";
import { getEnv } from "@/lib/env";

type PasswordResetCodeEmailProps = {
  fullName: string;
  code: string;
  expiryMinutes: number;
  signInUrl: string;
};

export function PasswordResetCodeEmail(props: PasswordResetCodeEmailProps) {
  const env = getEnv();

  return (
    <Html>
      <Head />
      <Preview>Your Flow password reset code is {props.code}.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={brandSection}>
            <Img
              alt="Flow logo"
              height="42"
              src={getEmailBrandUrl(env.APP_URL)}
              style={brandLogo}
              width="132"
            />
            <Text style={brandSloganStyle}>Xlabs Technology Management</Text>
          </Section>
          <Heading style={heading}>Reset your Flow password</Heading>
          <Text style={text}>Hello {props.fullName},</Text>
          <Text style={text}>
            Use the one-time code below to reset the password for your invited Flow email.
          </Text>
          <Section style={codeCard}>
            <Text style={codeLabel}>Password reset code</Text>
            <Text style={codeValue}>{props.code}</Text>
          </Section>
          <Text style={text}>
            This code expires in {props.expiryMinutes} minutes. If you did not request it, you can
            ignore this email.
          </Text>
          <Text style={footer}>Sign-in page: {props.signInUrl}</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f4f7fb",
  fontFamily: "Inter, Arial, sans-serif",
  padding: "24px 0",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "18px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "32px",
};

const heading = {
  color: "#111827",
  fontSize: "24px",
  marginBottom: "20px",
};

const brandSection = {
  backgroundColor: "#0f172a",
  borderRadius: "16px",
  marginBottom: "24px",
  padding: "18px 20px",
};

const brandLogo = {
  display: "block",
  height: "42px",
  margin: "0 0 8px",
  maxWidth: "100%",
  width: "132px",
};

const brandSloganStyle = {
  color: "#e2e8f0",
  fontSize: "14px",
  fontWeight: "600",
  letterSpacing: "0.02em",
  lineHeight: "20px",
  margin: "0",
};

const text = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "24px",
};

const codeCard = {
  backgroundColor: "#f8fafc",
  border: "1px solid #dbeafe",
  borderRadius: "16px",
  margin: "24px 0",
  padding: "20px 24px",
  textAlign: "center" as const,
};

const codeLabel = {
  color: "#64748b",
  fontSize: "12px",
  letterSpacing: "0.18em",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
};

const codeValue = {
  color: "#0f172a",
  fontSize: "32px",
  fontWeight: "700",
  letterSpacing: "0.28em",
  margin: "0",
};

const footer = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "20px",
  wordBreak: "break-all" as const,
};

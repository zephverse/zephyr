import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Preview,
  render,
  Section,
  Text,
} from "@react-email/components";
import { emailConfig } from "../config";

type VerificationEmailProps = {
  verificationUrl: string;
};

export const VerificationEmail = ({
  verificationUrl,
}: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>{emailConfig.templates.verification.subject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Text style={heading}>
            Welcome to <span style={brand}>{emailConfig.company.name}</span> ✨
          </Text>
          <Text style={paragraph}>
            We're thrilled to have you join our community of innovators and
            creators!
          </Text>

          <Section style={card}>
            <Text style={emoji}>🔐</Text>
            <Text style={subheading}>Verify Your Email</Text>
            <Text style={paragraph}>
              Please verify your email address within{" "}
              {emailConfig.templates.verification.expiryTime} to complete your
              registration.
            </Text>
            <Button href={verificationUrl} style={button}>
              {emailConfig.templates.verification.buttonText}
            </Button>
          </Section>

          <Section style={features}>
            <Text style={featuresTitle}>What's Next? 🎯</Text>
            {emailConfig.assets.features.map((feature) => (
              <Section key={feature.title} style={featureCard}>
                <Text style={featureEmoji}>{feature.emoji}</Text>
                <div>
                  <Text style={featureTitle}>{feature.title}</Text>
                  <Text style={featureDescription}>{feature.description}</Text>
                </div>
              </Section>
            ))}
          </Section>

          <Section style={card}>
            <Text style={helpTitle}>Need Help? 💁‍♂️</Text>
            <Text style={paragraph}>
              Our support team is here to help you 24/7
            </Text>
            <Text style={links}>
              <Link
                href={`mailto:${emailConfig.company.supportEmail}`}
                style={link}
              >
                Contact Support
              </Link>
              {" • "}
              <Link href={emailConfig.company.website} style={link}>
                Help Center
              </Link>
            </Text>
          </Section>

          <Text style={footerLinks}>
            <Link href={emailConfig.legal.privacy.url} style={footerLink}>
              {emailConfig.legal.privacy.text}
            </Link>{" "}
            <Link href={emailConfig.legal.terms.url} style={footerLink}>
              {emailConfig.legal.terms.text}
            </Link>{" "}
            <Link href={emailConfig.legal.unsubscribe.url} style={footerLink}>
              {emailConfig.legal.unsubscribe.text}
            </Link>
          </Text>
          <Text style={footer}>
            © {new Date().getFullYear()} {emailConfig.company.name}. All rights
            reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export const getVerificationEmailHtml = (verificationUrl: string) =>
  render(<VerificationEmail verificationUrl={verificationUrl} />);

const main = {
  backgroundColor: "#f9fafb",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "700px",
};

const box = {
  backgroundColor: "rgba(255, 255, 255, 0.98)",
  backdropFilter: "blur(10px)",
  borderRadius: "24px",
  padding: "40px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  border: "1px solid #e5e7eb",
};

const heading = {
  fontSize: "24px",
  fontWeight: "600",
  color: emailConfig.assets.colors.textDark,
  textAlign: "center" as const,
  margin: "0 0 12px",
};

const brand = {
  background: `linear-gradient(135deg, ${emailConfig.assets.colors.primary} 0%, ${emailConfig.assets.colors.primaryHover} 100%)`,
  color: "white",
  padding: "4px 12px",
  borderRadius: "12px",
  display: "inline-block",
  fontWeight: "700",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: emailConfig.assets.colors.text,
  margin: "0 0 24px",
};

const card = {
  backgroundColor: emailConfig.assets.colors.cardBg,
  borderRadius: "16px",
  padding: "24px",
  border: `1px solid ${emailConfig.assets.colors.border}`,
  marginBottom: "16px",
  textAlign: "center" as const,
};

const emoji = {
  fontSize: "48px",
  marginBottom: "16px",
  display: "block",
};

const subheading = {
  fontSize: "20px",
  fontWeight: "600",
  color: emailConfig.assets.colors.textDark,
  margin: "0 0 12px",
};

const button = {
  backgroundColor: emailConfig.assets.colors.primary,
  borderRadius: "12px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 40px",
  boxShadow: "0 4px 6px -1px rgba(249, 115, 22, 0.25)",
};

const features = {
  margin: "32px 0",
};

const featuresTitle = {
  fontSize: "20px",
  fontWeight: "600",
  color: emailConfig.assets.colors.textDark,
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const featureCard = {
  backgroundColor: emailConfig.assets.colors.cardBg,
  borderRadius: "16px",
  padding: "16px",
  border: `1px solid ${emailConfig.assets.colors.border}`,
  marginBottom: "16px",
  display: "flex",
  alignItems: "center",
  gap: "16px",
};

const featureEmoji = {
  fontSize: "32px",
  paddingRight: "8px",
};

const featureTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: emailConfig.assets.colors.textDark,
  margin: "0 0 4px",
};

const featureDescription = {
  fontSize: "14px",
  color: emailConfig.assets.colors.text,
  margin: "0",
};

const helpTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: emailConfig.assets.colors.textDark,
  margin: "0 0 12px",
};

const links = {
  margin: "0 0 16px",
};

const link = {
  color: emailConfig.assets.colors.primary,
  textDecoration: "none",
  fontSize: "14px",
  margin: "0 12px",
};

const footerLinks = {
  textAlign: "center" as const,
  marginBottom: "16px",
};

const footerLink = {
  color: emailConfig.assets.colors.text,
  textDecoration: "none",
  fontSize: "12px",
  margin: "0 8px",
};

const footer = {
  fontSize: "12px",
  color: emailConfig.assets.colors.textLight,
  textAlign: "center" as const,
  margin: "0",
};

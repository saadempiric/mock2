"use client";
import React, { useState } from "react";
import {
  Container,
  Title,
  Text,
  Grid,
  TextInput,
  Textarea,
  Button,
  Stack,
} from "@mantine/core";
import ReCAPTCHA from "react-google-recaptcha";

interface contactProps {
  header: string;
  subHeader: string;
}

const ContactSection = ({ header, subHeader }: contactProps) => {
  const [captacha, setCaptcha] = useState<string | null>();
  return (
    <Container size="xl" py={100} bg="white" style={{ marginBottom: "-80px" }}>
      <Grid gutter={60}>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack>
            <Title
              order={1}
              size={44}
              style={{
                background: "linear-gradient(90deg, #ff4bac, #4b9bff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block", // Ensures the gradient applies correctly
              }}
            >
              {header}
            </Title>
            <Text size="24px" c="dimmed">
              {subHeader}
            </Text>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <form>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="First Name"
                  placeholder="Your first name"
                  radius="md"
                  required
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Last Name"
                  placeholder="Your last name"
                  radius="md"
                  required
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Email"
                  placeholder="your.email@example.com"
                  radius="md"
                  required
                  type="email"
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Company"
                  placeholder="Your company name"
                  radius="md"
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Country"
                  placeholder="Your country"
                  radius="md"
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Phone Number"
                  placeholder="Your phone number"
                  radius="md"
                  type="tel"
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <Textarea
                  label="Message"
                  placeholder="How can we help you?"
                  radius="md"
                  minRows={4}
                />
              </Grid.Col>

              <Grid.Col
                span={12}
                display="flex"
                style={{ justifyContent: "flex-end" }}
              >
                <Button variant="outline" color="violet" radius="md">
                  Submit
                </Button>
              </Grid.Col>
            </Grid>
          </form>
        </Grid.Col>
      </Grid>
      <ReCAPTCHA
        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
        className="mx-auto"
        onChange={setCaptcha}
      />
    </Container>
  );
};

export default ContactSection;

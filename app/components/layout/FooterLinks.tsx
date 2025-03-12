"use client";
import React, { useState, useRef } from "react";
import {
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandYoutube,
} from "@tabler/icons-react";
import { ActionIcon, Container, Group, Text } from "@mantine/core";
import { Box, Title, Flex } from "@mantine/core";

import classes from "../../style/footerLinks.module.css";

const data = [
  {
    title: "About",
    links: [
      { label: "Careers", link: "#" },
      { label: "Our Story", link: "#" },
      { label: "Contact us", link: "#" },
      { label: "Locations", link: "#" },
      { label: "Sitemap", link: "#" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Privacy Statement", link: "#" },
      { label: "Terms & Conditions", link: "#" },
      { label: "Cookie policy", link: "#" },
    ],
  },
];

// Define type for positions object
type PositionsType = {
  [key: string]: number;
};

export default function FooterLinks() {
  const boxHeight = 30; // pixels

  // Text offset for initial position (to show top of filled, bottom of unfilled)
  const getInitialOffset = (isFilled: boolean) => {
    return isFilled ? "0px" : "-24px";
  };

  const [mousePosition, setMousePosition] = useState({ y: 0.5 });
  const footerRef = useRef<HTMLDivElement | null>(null);

  // Handle mouse movement only within the footer
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (footerRef.current) {
      // Get the footer's position and dimensions
      const footerRect = footerRef.current.getBoundingClientRect();

      // Calculate the relative Y position within the footer (0 to 1)
      const relativeY = (e.clientY - footerRect.top) / footerRect.height;

      setMousePosition({ y: relativeY });
    }
  };

  // Reset when mouse leaves
  const handleMouseLeave = () => {
    setMousePosition({ y: 0.5 }); // Center position (neutral)
  };

  // Define positions with proper typing
  const positions: PositionsType = {
    // Filled texts
    filled_0: 0, // First filled at base position
    filled_1: 10, // Second filled 10px to the right
    filled_2: 0, // Third filled at base position

    // Unfilled texts - positioned relative to their filled counterparts
    unfilled_0: 10, // First unfilled to the right of first filled (+10px from first filled)
    unfilled_1: 0, // Second unfilled to the left of second filled (-10px from second filled)
    unfilled_2: 10, // Third unfilled to the right of third filled (+10px from third filled)
  };

  // Calculate transform values based on mouse position
  const calculateTransform = (textType: string, index: number) => {
    // Maximum movement in pixels
    const maxMovement = 30;

    // Direction based on filled/unfilled (opposing movement)
    const direction = textType === "filled" ? 1 : -1;

    // Calculate offset from center (0.5)
    const offset = (mousePosition.y - 0.5) * 2; // -1 to 1 range

    // Get the pair index (0 for positions 0-1, 1 for positions 2-3, etc.)
    const pairIndex = Math.floor(index / 2);

    // Create the key for positions lookup
    const positionKey = `${textType}_${pairIndex}`;

    // Look up the horizontal position for this text element
    const horizontalOffset = positions[positionKey] || 0;

    // Apply transform with both vertical movement and horizontal offset
    return `translateY(${
      offset * maxMovement * direction
    }px) translateX(${horizontalOffset}px)`;
  };

  const transformTexts = [
    { type: "filled", zIndex: 6 },
    { type: "unfilled", zIndex: 5 },
    { type: "filled", zIndex: 4 },
    { type: "unfilled", zIndex: 3 },
    { type: "filled", zIndex: 2 },
    { type: "unfilled", zIndex: 1 },
  ];

  const groups = data.map((group) => {
    const links = group.links.map((link, index) => (
      <Text<"a">
        key={index}
        className={classes.link}
        component="a"
        href={link.link}
        onClick={(event) => event.preventDefault()}
      >
        {link.label}
      </Text>
    ));

    return (
      <div className={classes.wrapper} key={group.title}>
        {links}
      </div>
    );
  });

  return (
    <footer className={classes.footer}>
      <Container className={classes.inner}>
        {/* footer list */}
        <div className={classes.groups}>{groups}</div>
        {/* Transform Animation */}
        <Box
          className={classes.mainBox}
          component="footer"
          py="sm"
          px="xl"
          bg="transparent"
          ref={footerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <Box
            style={{
              width: "360px",
              overflow: "visible",
            }}
          >
            <Flex
              direction="column"
              style={{
                width: "100%",
              }}
            >
              {transformTexts.map((text, index) => (
                <Box
                  key={index}
                  style={{
                    height: `${boxHeight}px`,
                    overflow: "hidden",
                    width: "100%",
                    position: "relative",
                  }}
                >
                  <Title
                    className={classes.transformTitle}
                    order={2}
                    fw={900}
                    style={{
                      letterSpacing: "2px",
                      fontSize: "52px",
                      position: "absolute",
                      top: getInitialOffset(text.type === "filled"),
                      right: 0,
                      transform: calculateTransform(text.type, index),
                      transition: "transform 0.7s ease-out",
                      whiteSpace: "nowrap",
                      lineHeight: "42px",
                      ...(text.type === "unfilled" && {
                        color: "transparent",
                        WebkitTextStroke: "1.5px black",
                      }),
                    }}
                  >
                    TRANSFORM
                  </Title>
                </Box>
              ))}
            </Flex>
          </Box>
        </Box>
      </Container>
      <Container className={classes.afterFooter}>
        <Text>© 2025 Empiric Technology. All rights reserved.</Text>

        {/* Social Icons */}
        <Group
          gap={0}
          className={classes.social}
          justify="flex-end"
          wrap="nowrap"
        >
          <ActionIcon size="lg" color="white" variant="subtle">
            <IconBrandTwitter size={18} stroke={1.5} color="#fefefe" />
          </ActionIcon>
          <ActionIcon size="lg" color="white" variant="subtle">
            <IconBrandYoutube size={18} stroke={1.5} color="#fefefe" />
          </ActionIcon>
          <ActionIcon size="lg" color="white" variant="subtle">
            <IconBrandInstagram size={18} stroke={1.5} color="#fefefe" />
          </ActionIcon>
        </Group>
      </Container>
    </footer>
  );
}

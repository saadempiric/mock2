"use client";

import React, { useState, useEffect } from "react";
import Buttons from "../Buttons";
import { Box, Title, Text, Button, Group, rem } from "@mantine/core";

import { createStyles, keyframes } from "@mantine/styles";
import Navbar from "../layout/Navbar";
import SubNavigation from "../layout/SubNavigation"; // Import the new component

interface Slide {
  image: string;
  title: string;
  description: string;
  buttonText: string;
}

// Define keyframes for animation
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const fadeOut = keyframes({
  from: { opacity: 1 },
  to: { opacity: 0 },
});

// Create styles
const useStyles = createStyles((theme: any) => ({
  carouselContainer: {
    position: "relative",
    width: "100%",
    height: "100vh",
    overflow: "hidden",
    // marginTop: '0px'
  },
  slide: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    transition: "opacity 1s ease-in-out",
    zIndex: 0,
    opacity: 0,
    marginTop: "40px", // Add margin to make space for SubNavigation component
  },
  activeSlide: {
    zIndex: 10,
    opacity: 1,
    animation: `${fadeIn} 1s ease-in-out`,
  },
  slideImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to left, rgba(0,0,0,0.6), transparent)",
  },
  contentContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "50%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: theme.spacing.xl,
    color: theme.white,
  },
  title: {
    fontSize: "200px",
    fontWeight: 700,
    marginBottom: theme.spacing.md,
    background: "linear-gradient(90deg, #ff4bac, #4b9bff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textAlign: "left",
  },
  description: {
    fontSize: theme.fontSizes.lg,
    marginBottom: theme.spacing.lg,
    textAlign: "left",
    width: "80%",
    display: "flex",
  },
  navigationDots: {
    position: "absolute",
    bottom: theme.spacing.md,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 20,
  },
  dot: {
    width: rem(12),
    height: rem(12),
    borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    transition: "background-color 0.3s",
    cursor: "pointer",
    border: "none",
    padding: 0,
    margin: `0 ${theme.spacing.xs}`,
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.8)",
    },
  },
  activeDot: {
    backgroundColor: theme.white,
  },
  carouselButton: {
    backgroundColor: "transparent",
    border: `1px solid ${theme.white}`,
    color: theme.white,
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius: theme.radius.sm,
    transition: "all 0.3s",
    "&:hover": {
      backgroundColor: theme.white,
      color: theme.black,
    },
  },
  heroWrapper: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    position: "relative",
  },
}));

const HeroCarousel: React.FC = () => {
  const { classes, cx } = useStyles();
  const [activeSlide, setActiveSlide] = useState<number>(0);

  // Carousel content with images and text
  const slides: Slide[] = [
    {
      image: "Designer.jpg",
      title: "Transform with Intelligence",
      description:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s ",
      buttonText: "See how we do it",
    },
    {
      image: "Designer (1).jpg",
      title: "Innovate With Data",
      description:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s ",
      buttonText: "Explore solutions",
    },
    {
      image: "Designer (2).jpg",
      title: "Secure Your Future",
      description:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s ",
      buttonText: "Learn more",
    },
  ];

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  // Handle manual navigation
  const goToSlide = (index: number) => {
    setActiveSlide(index);
  };

  return (
    <Box className={classes.heroWrapper}>
      <Navbar />
      <Box className={classes.carouselContainer}>
        {/* Carousel container */}
        {slides.map((slide, index) => (
          <Box
            key={index}
            className={cx(classes.slide, {
              [classes.activeSlide]: index === activeSlide,
            })}
          >
            {/* Background Image */}
            <img
              src={slide.image}
              alt={slide.title}
              className={classes.slideImage}
            />

            {/* Semi-transparent overlay for better text visibility */}
            <Box className={classes.overlay} />

            {/* Text content positioned on the right */}
            <Box className={classes.contentContainer}>
              <Title className={classes.title} size="50px">
                {slide.title}
              </Title>
              <Text className={classes.description}>{slide.description}</Text>
              <div
                style={{
                  marginTop: "-24px",
                }}
              >
                <Buttons width="21%" text="See how we do it" />
              </div>
            </Box>
          </Box>
        ))}

        {/* Navigation dots */}
        <Group className={classes.navigationDots}>
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cx(classes.dot, {
                [classes.activeDot]: index === activeSlide,
              })}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </Group>
      </Box>
    </Box>
  );
};

export default HeroCarousel;

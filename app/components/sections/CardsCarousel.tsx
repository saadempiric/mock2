import { useRef } from "react";
import { Carousel } from "@mantine/carousel";
import { Button, Paper, Text, Title, useMantineTheme } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import Autoplay from "embla-carousel-autoplay";
import "@mantine/core/styles.css";
import "@mantine/carousel/styles.css";
import classes from "../../style/CardsCarousel.module.css";
import { StaticImageData } from "next/image";

interface CardProps {
  title: string;
  category: string;
  image: string | StaticImageData;
}

function Card({ image, title, category }: CardProps) {
  return (
    <Paper
      shadow="md"
      p="xl"
      radius={0}
      style={{ backgroundImage: `url(${image})` }}
      className={classes.card}
    >
      <div>
        <Text className={classes.category} size="xs">
          {category}
        </Text>
        <Title order={3} className={classes.title}>
          {title}
        </Title>
      </div>
      <Button variant="white" color="dark">
        Read article
      </Button>
    </Paper>
  );
}

interface CardData {
  image: string;
  title: string;
  category: string;
}

interface CardsProps {
  type: string;
  data: Array<CardData>;
}

export default function CardsCarousel({ type, data }: CardsProps) {
  const theme = useMantineTheme();
  const mobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const autoplay = useRef(Autoplay({ delay: 2000 }));

  const slides = data.map((item) => (
    <Carousel.Slide key={item.title}>
      <Card {...item} />
    </Carousel.Slide>
  ));

  return (
    <>
      <h1 className={classes.header}>{type}</h1>
      <Carousel
        slideSize={{ base: "100%", sm: "25%" }}
        slideGap={{ base: 2, sm: "xl" }}
        align="start"
        slidesToScroll={1}
        loop
        dragFree
        plugins={[autoplay.current]}
        onMouseEnter={autoplay.current.stop}
        onMouseLeave={autoplay.current.reset}
        withIndicators
      >
        {slides}
      </Carousel>
    </>
  );
}

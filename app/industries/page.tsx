"use client";
import React from "react";
import { useState } from "react";
import HeroCarousel from "../components/sections/HeroCarousel";
import CardsCarousel from "../components/sections/CardsCarousel";
import Footer from "../components/layout/FooterLinks";
import ReactCookieBot from "react-cookiebot";
import ContactSection from "../components/sections/ContactSection";
import Stats from "../components/Stats";
import ClientChatWrapper from "../components/chatbot/ClientChatWrapper";

function page() {
  const CardSliderheader =
    "How Manufacturing is transforming and making their journey towards Industry 4.0";

  const cardsData = [
    //had ti insert title here because of index error, as the data is mapped with title as it's key
    {
      image:
        "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=400&q=80",
      title: "1",
      category:
        "How intelligent systems extracts insights for predictive maintenance & demand forecasting?",
    },
    {
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80",
      title: "2",
      category:
        "How to reduce downtime or Over-Utilization of Resources in Manufacturing?s",
    },
    {
      image:
        "https://images.unsplash.com/photo-1533750349088-cd871a92f312?auto=format&fit=crop&w=400&q=80",
      title: "3",
      category:
        "How to ensure that our product will meet the Industry standards?",
    },
    {
      image:
        "https://images.unsplash.com/photo-1562907550-096d3bf9b25c?auto=format&fit=crop&w=400&q=80",
      title: "4",
      category:
        "Useful ways for Manufacturers on how to Cope with Supply Chain Disruptions?",
    },
    {
      image:
        "https://images.unsplash.com/photo-1562907550-096d3bf9b25c?auto=format&fit=crop&w=400&q=80",
      title: "5",
      category:
        "Useful ways for Manufacturers on how to Cope with Supply Chain Disruptions?",
    },
    {
      image:
        "https://images.unsplash.com/photo-1562907550-096d3bf9b25c?auto=format&fit=crop&w=400&q=80",
      title: "6",
      category:
        "Useful ways for Manufacturers on how to Cope with Supply Chain Disruptions?",
    },
    {
      image:
        "https://images.unsplash.com/photo-1562907550-096d3bf9b25c?auto=format&fit=crop&w=400&q=80",
      title: "7",
      category:
        "Useful ways for Manufacturers on how to Cope with Supply Chain Disruptions?",
    },
  ];

  const statHeader = "Manufacturing in numbers";

  const statsData = [
    {
      title: "70%",
      subtitle: "",
      description:
        "of manufacturers indicated that problems with data, including data quality and validation are the most significant obstacles to AI implementation",
    },
    {
      title: "90%",
      subtitle: "",
      description:
        "More rework and waste increase production costs in Manufacturing.",
    },
    {
      title: "60%",
      subtitle: "",
      description:
        "of manufacturers cited the inability to attract and retain employees as their top challenge",
    },
    {
      title: "35%",
      subtitle: "",
      description:
        "of surveyed manufacturers cited transportation and logistics costs as a primary business challenge",
    },
  ];

  const footerHeader = "Talk to one of our manufacturing expert";
  const footerSubHeader =
    "Our expert team will be delighted to connect with you";

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "40px",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
          }}
        >
          <HeroCarousel />
        </div>
        <Stats header={statHeader} subHeader="" statsData={statsData} />
        <CardsCarousel type={CardSliderheader} data={cardsData} />
        <ContactSection header={footerHeader} subHeader={footerSubHeader} />
        <ClientChatWrapper />
        <Footer />
      </div>
    </>
  );
}

export default page;

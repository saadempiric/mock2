"use client";
import { useState } from "react";
import HeroCarousel from "./components/sections/HeroCarousel";
import CardsCarousel from "./components/sections/CardsCarousel";
import Footer from "./components/layout/FooterLinks";
import ReactCookieBot from "react-cookiebot";
import ContactSection from "./components/sections/ContactSection";
import Stats from "./components/Stats";
import ClientChatWrapper from "./components/chatbot/ClientChatWrapper";

const domainGroupId = "496fb544-306f-4b4e-b20c-7159a4b6d2bc";

export default function Home() {
  const [hasCookieBot, setHasCookieBot] = useState<boolean>(false);
  const industriesData = [
    {
      image:
        "https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&w=400&q=80",
      title: "Manufacturing",
      category: "industries",
    },
    {
      image:
        "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=400&q=80",
      title: "Utilities",
      category: "industries",
    },
    {
      image:
        "https://images.unsplash.com/photo-1503594384566-461fe158e797?auto=format&fit=crop&w=400&q=80",
      title: "Construction",
      category: "industries",
    },
    {
      image:
        "https://images.unsplash.com/photo-1571615340109-ce9d81fbc508?auto=format&fit=crop&w=400&q=80",
      title: "Government & Public Sector",
      category: "industries",
    },
    {
      image:
        "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=400&q=80",
      title: "Healthcare",
      category: "industries",
    },
    {
      image:
        "https://images.unsplash.com/photo-1561414927-6d86591d0c4f?auto=format&fit=crop&w=400&q=80",
      title: "Financial Services",
      category: "industries",
    },
    {
      image:
        "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80",
      title: "Retail",
      category: "industries",
    },
    {
      image:
        "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=400&q=80",
      title: "Education",
      category: "industries",
    },
  ];

  const offeringsData = [
    {
      image:
        "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=400&q=80",
      title: "Business Applications",
      category: "offerings",
    },
    {
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80",
      title: "Managed Services",
      category: "offerings",
    },
    {
      image:
        "https://images.unsplash.com/photo-1533750349088-cd871a92f312?auto=format&fit=crop&w=400&q=80",
      title: "Strategy & Consulting",
      category: "offerings",
    },
    {
      image:
        "https://images.unsplash.com/photo-1562907550-096d3bf9b25c?auto=format&fit=crop&w=400&q=80",
      title: "Cloud",
      category: "offerings",
    },
    {
      image:
        "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=400&q=80",
      title: "Artificial Intelligence",
      category: "offerings",
    },
    {
      image:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80",
      title: "Cybersecurity",
      category: "offerings",
    },
    {
      image:
        "https://images.unsplash.com/photo-1520869562399-e772f042f422?auto=format&fit=crop&w=400&q=80",
      title: "Data Analytics",
      category: "offerings",
    },
    {
      image:
        "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&w=400&q=80",
      title: "Digital Transformation",
      category: "offerings",
    },
  ];

  const statsHeader =
    "Transform the world through the power of innovation and ingenuity";
  const statsSubHeader =
    "We are all about solving wicked problems around us using cutting-edge technology, creativity and outcomes. Our core values guide us towards creating a better world for our collective tomorrow!";

  const statsData = [
    {
      title: "100+ years",
      subtitle: "Team experience",
      description: "Delivering Business applications across the globe",
    },
    {
      title: "4 countries",
      subtitle: "Global Locations",
      description: "Ready to serve our clients",
    },
    {
      title: "24x7",
      subtitle: "Time Zone Coverage",
      description: "For robust managed services offerings",
    },
    {
      title: "100%",
      subtitle: "Client Retention",
      description: "Our clients persist with us",
    },
    {
      title: "360°",
      subtitle: "Offerings",
      description: "We are a one-stop shop for all your business needs",
    },
  ];

  const footerHeader = "Talk to one of our experts";
  const footerSubHeader =
    "Our expert team will be delighted to connect with you";

  return (
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
      <ReactCookieBot domainGroupId={domainGroupId} />
      <CardsCarousel type="Industries" data={industriesData} />
      <CardsCarousel type="Offerings" data={offeringsData} />
      <Stats
        header={statsHeader}
        subHeader={statsSubHeader}
        statsData={statsData}
      />
      <ContactSection header={footerHeader} subHeader={footerSubHeader} />
      <ClientChatWrapper />
      <Footer />

      {/* <button onClick={()=> {
        setHasCookieBot(!!document.querySelector('#CookieBot'))}
      }>
        Press to check if cookie bot is injected correctly
      </button>
      <p> {hasCookieBot && `Cookiebot is correctly injected`}</p> */}
    </div>
  );
}

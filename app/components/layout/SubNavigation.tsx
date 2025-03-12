// src/components/layout/SubNavigation.tsx
"use client";
import React from "react";
import Link from "next/link";
import { createStyles } from "@mantine/styles";

const useStyles = createStyles((theme: any) => ({
  subNavContainer: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "10px 40px",
    background:
      "linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.2) 30%, rgba(255, 255, 255, 0.4) 60%, rgba(255, 255, 255, 0.7) 80%, rgba(234, 234, 234, 0.85) 90%)",
    position: "absolute",
    width: "100%",
    right: 0,
    left: 0,
    top: "80%", // Position it right below the parent
    zIndex: 25,
  },
  fadeEffect: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "1px",
    background:
      "linear-gradient(to right, transparent 0%, rgba(234, 234, 234, 0.05) 30%, rgba(234, 234, 234, 0.15) 60%, rgba(234, 234, 234, 0.4) 80%, rgba(234, 234, 234, 0.7) 90%)",
  },
  linkContainer: {
    display: "flex",
    gap: "40px",
    alignItems: "center",
  },
  link: {
    textDecoration: "none",
    color: "#333",
    fontSize: "16px",
    fontWeight: 500,
    transition: "color 0.3s ease",
    "&:hover": {
      color: "#4b9bff",
    },
  },
  connectLink: {
    textDecoration: "none",
    color: "#ff4bac",
    fontSize: "16px",
    fontWeight: 600,
    transition: "color 0.3s ease",
    "&:hover": {
      color: "#4b9bff",
    },
  },
}));

const SubNavigation: React.FC = () => {
  const { classes } = useStyles();

  return (
    <div className={classes.subNavContainer}>
      <div className={classes.fadeEffect}></div>
      <div className={classes.linkContainer}>
        <Link href="/insights" className={classes.link}>
          Insights
        </Link>
        <Link href="/contact" className={classes.connectLink}>
          Want to Connect with us?
        </Link>
      </div>
    </div>
  );
};

export default SubNavigation;

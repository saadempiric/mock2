// src/components/layout/Navbar.jsx
"use client";
import React from "react";
import Image from "next/image";
import logo from "../../images/Logo.png";
import navStyle from "../../style/navbar.module.css";
import { FaFacebook } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";
import { FaInstagramSquare } from "react-icons/fa";
import { IoLogoYoutube } from "react-icons/io";
import { CiSearch } from "react-icons/ci";
import { TextInput } from "@mantine/core";
import SubNavigation from "./SubNavigation";

const Navbar = () => {
  return (
    <>
      <div className={navStyle.header}>
        <Image
          src={logo}
          className={navStyle.logo}
          alt="Empiric Logo"
          width={220}
          height={220}
          objectFit="cover"
        />
        <nav className={navStyle.navbar}>
          <ul className={navStyle.listContainer}>
            <li className={navStyle.menuitem}>
              <select className={navStyle.dropdown}>
                <option>What we do</option>
              </select>
            </li>
            <li className={navStyle.menuitem}>Insights</li>
            <li className={navStyle.menuitem}>
              <select className={navStyle.dropdown}>
                <option>Our story</option>
              </select>
            </li>
            <li className={navStyle.menuitem}>
              <select className={navStyle.dropdown}>
                <option>Careers</option>
              </select>
            </li>
            <li className={navStyle.menuitem}>Contact Us</li>
          </ul>
        </nav>
        <div className={navStyle.searchContainer}>
          <div className={navStyle.socialIcons}>
            <FaFacebook size={25} />
            <FaLinkedin size={25} />
            <FaInstagramSquare size={25} />
            <IoLogoYoutube size={25} />
          </div>
          <TextInput
            className={navStyle.searchBar}
            radius={0}
            size="md"
            placeholder="Search questions"
            rightSectionWidth={42}
            rightSection={<CiSearch size={30} />}
            style={{
              backgroundColor: "transparent",
              borderStyle: "solid",
              borderColor: "black",
              borderWidth: "1.4px",
              boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          />
        </div>
        <SubNavigation />
      </div>
    </>
  );
};

export default Navbar;

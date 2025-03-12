"use client";

import React, { useState, useEffect, useRef } from "react";
import classes from "../style/stats.module.css";

interface StatItem {
  title: string;
  subtitle: string;
  description: string;
}

interface StatsProps {
  header: string;
  subHeader: string;
  statsData: StatItem[];
}

function Stats({ header, subHeader, statsData }: StatsProps) {
  const [animatedValues, setAnimatedValues] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // Parse the numeric part from the title
  const parseNumericValue = (title: string) => {
    // Extract numbers from strings like "100+", "24x7", "360°"
    const matches = title.match(/(\d+)/);
    return matches ? parseInt(matches[0]) : 0;
  };

  // Format the animated value to match the original format (adding +, x7, ° etc.)
  const formatAnimatedValue = (value: number, originalTitle: string) => {
    const numericPart = parseNumericValue(originalTitle);
    return originalTitle.replace(
      numericPart.toString(),
      Math.round(value).toString()
    );
  };

  useEffect(() => {
    // Initialize animated values at 0
    setAnimatedValues(statsData.map(() => "0"));

    // Set up intersection observer to detect when the stats section is visible
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Only trigger animation once
        }
      },
      { threshold: 0.1 } // Trigger when 10% of the element is visible
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) {
        observer.disconnect();
      }
    };
  }, [statsData]);

  useEffect(() => {
    if (!isVisible) return;

    // Get the target values for each stat
    const targetValues = statsData.map((item) => parseNumericValue(item.title));

    // Animation duration in milliseconds
    const duration = 2000;
    const frameRate = 60;
    const totalFrames = (duration * frameRate) / 1000;
    let frame = 0;

    const animate = () => {
      // Calculate current progress (0 to 1)
      const progress = frame / totalFrames;

      // Use easeOutQuad easing function
      const easedProgress = 1 - (1 - progress) * (1 - progress);

      // Update each value based on progress
      const newValues = statsData.map((item, index) => {
        const currentValue = targetValues[index] * easedProgress;
        return formatAnimatedValue(currentValue, item.title);
      });

      setAnimatedValues(newValues);

      frame++;

      if (frame <= totalFrames) {
        requestAnimationFrame(animate);
      }
    };

    // Start animation
    requestAnimationFrame(animate);
  }, [isVisible, statsData]);

  console.log("Stats data received:", statsData);

  return (
    <div className={classes.parent}>
      <h1 className={classes.header}>{header}</h1>
      <h4 className={classes.subHeader}>{subHeader}</h4>
      <div ref={statsRef} className={classes.statsContainer}>
        {statsData.map((item, index) => (
          <div key={index} className={classes.statItem}>
            <h2 className={classes.statTitle}>
              {isVisible ? animatedValues[index] : "0"}
            </h2>
            <h3 className={classes.statSubtitle}>{item.subtitle}</h3>
            <p className={classes.statDescription}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Stats;

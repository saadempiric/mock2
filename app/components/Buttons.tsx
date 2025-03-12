"use client"
import React, { useState } from 'react';
import { Button } from '@mantine/core';


interface ButtonsProps {
  width?: string | number;
  text : string
}


function Buttons({width, text}: ButtonsProps) {
  const [flag, setFlag] = useState(false);

  return (
    <>
<div style={{
      marginLeft:'30px',
      marginTop:'50px',
      position:'relative',
      display:'flex',
      justifyContent:'center',
      alignItems:'center',
      background: 'linear-gradient(90deg, #ff4bac, #4b9bff)', 
      width: width, 
      height:'41px'
      }}
      onMouseEnter={()=>setFlag(true)}
      onMouseLeave={()=>setFlag(false)}>

      <Button
        variant="gradient"
        style={{
          transition: '0.3s ease', 
          background: flag ? 'linear-gradient(90deg, #ff4bac, #4b9bff)' : 'white',
          color: flag ? 'white' : 'black', 
          position:'absolute',
          borderStyle: 'none',
          borderRadius:'0px',
        }}
        >
        {text}
      </Button>
    </div>
    </>
  )
}

export default Buttons

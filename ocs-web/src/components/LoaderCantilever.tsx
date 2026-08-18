const LoaderCantilever = ({noLabel=false,className=''}) => {

  return(
    <span className={`${className} flex flex-col justify-center items-center relative`} style={{ color: 'inherit' }}>
      <svg width="100%" height="100%"  viewBox="0 0 51 51" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="0.706299" y1="4.07714" x2="46.2099" y2="4.07714" stroke="currentColor"/>
      <line x1="0.364692" y1="36.4411" x2="33.3725" y2="5.39179" stroke="currentColor"/>
      <line x1="41.9387" y1="4.57714" x2="41.9387" y2="1.04059" stroke="currentColor"/>
      <ellipse cx="42.3208" cy="0.922706" rx="0.825195" ry="0.825195" fill="currentColor"/>


      <line x1="33.2151" y1="5.75599" x2="33.2151" y2="4.57714" stroke="currentColor"/>


      <path d="M0 34.5199H1.17885C1.96012 34.5199 2.59347 35.1533 2.59347 35.9345C2.59347 36.7158 1.96012 37.3492 1.17885 37.3492H0V34.5199Z" fill="currentColor"/>
      <path d="M0 3.16252H1.17885C1.96012 3.16252 2.59347 3.79587 2.59347 4.57714C2.59347 5.35841 1.96012 5.99176 1.17885 5.99176H0V3.16252Z" fill="currentColor"/>

        <g className="rotate-group" transform-origin="5.99209px 31.7871px">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0; 5; 0; -5; 0"
            dur="2s"
            repeatCount="indefinite"
          />
          <line x1="7.87825" y1="33.909" x2="5.99209" y2="31.7871" stroke="currentColor"/>
          <line x1="8.28683" y1="33.0781" x2="42.6254" y2="35.4793" stroke="currentColor"/>
          <line x1="42.0564" y1="38.5334" x2="42.0564" y2="35.9292" stroke="currentColor"/>
          <line x1="42.4694" y1="35.4792" x2="43.6454" y2="35.5614" stroke="currentColor"/>
          <line x1="36.78" y1="38.7353" x2="48.5685" y2="38.7353" stroke="currentColor"/>
          <line x1="35.0119" y1="40.5489" x2="36.6791" y2="38.8818" stroke="currentColor"/>
          <line x1="48.6863" y1="38.8818" x2="50.3535" y2="40.5489" stroke="currentColor"/>
          <ellipse cx="42.4564" cy="38.4101" rx="0.825195" ry="0.825195" fill="currentColor"/>
        </g>
      </svg>
      {!noLabel && 
        <p className="font-bold relative" style={{ fontWeight: 'bold' }}>Loading</p>
      }
    </span>
  )
}

export default LoaderCantilever;

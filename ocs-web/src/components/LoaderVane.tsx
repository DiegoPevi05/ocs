import  { useEffect, useRef } from 'react';

const LoaderVane = ({noLabel=false,className=''}) => {

  const svgRef = useRef(null);

  useEffect(() => {
    // Create an interval to restart the animation every 2.5 seconds
    const interval = setInterval(() => {

      if (!svgRef.current || !svgRef) return;

      //@ts-ignore
      const group_lines    = svgRef.current.querySelector('.group-lines');

      const paths = group_lines.querySelectorAll('path');
      // Reset stroke-dashoffset for each path before starting the animation
      paths.forEach((path:SVGPathElement) => {
        path.setAttribute('stroke-dashoffset', '100');
      });

      // Start the first animation by triggering the 'op' element
      const opAnimation = group_lines.querySelector('#op');
      if (opAnimation) {
        opAnimation.beginElement();
      }

      const opAnimation2 = group_lines.querySelector('#op6');
      if (opAnimation2) {
        opAnimation2.beginElement();
      }


      //@ts-ignore
      const group_droppers = svgRef.current.querySelector('.group-droppers')
      const droppers = group_droppers.querySelectorAll('.dropper');

      droppers.forEach((dropper: SVGLineElement) => {
        const animateElement = dropper.firstChild as SVGAnimateElement;
        if (animateElement && animateElement.beginElement) {
          animateElement.beginElement();
        }
      });


    }, 3000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);


  return(

    <span className={`${className} flex flex-col justify-center items-center relative`} style={{ color: 'inherit' }}>

      <svg ref={svgRef}  width="100%" height="100%" viewBox="0 0 100 29" fill="none" xmlns="http://www.w3.org/2000/svg">

        <g className='group-lines'>
          <path d="M1.69092 5.80433C2.7214 5.42043 5.81661 3.90187 6.68287 3.0668
                   C13.5264 7.09255 29.2269 13.7753 44.8469 13.7753
                   C49.0342 13.9364 51.1276 14.0169 55.6365 13.7754
                   C71.1752 13.7753 86.5537 6.52896 93.3975 2.58371
                   C94.1031 3.43914 97.2788 5.41107 98.3093 5.80432"
                stroke="currentColor" strokeDasharray="500" strokeDashoffset="500">
            <animate id="op" attributeName="stroke-dashoffset" from="500" to="0" begin="0" dur="2.5s" fill="freeze"/>
          </path>
          <line x1="1.61035" y1="27.7681" x2="98.2288" y2="27.7681" stroke="currentColor" strokeDasharray="98.2288 98.2288" strokeDashoffset="98.2288">
            <animate id="op6" attributeName="stroke-dashoffset" from="98.2288" to="0" begin="0" dur="2.5s" fill="freeze"/>
          </line>
        </g>

        <g className="group-droppers">

          <line x1="1.27148" y1="28.2681" x2="1.27148" y2="5.72382" stroke="currentColor" strokeDasharray="28.2681 28.2681" strokeDashoffset="28.2681" className="dropper"> 
            <animate attributeName="stroke-dashoffset" from="28.2681" to="0" begin="1.5s" dur="1s" fill="freeze" />
          </line>
          <line x1="6.26318" y1="28.2681" x2="6.26318" y2="0.731838" stroke="currentColor" strokeDasharray="28.2681 28.2681" strokeDashoffset="28.2681" className="dropper">
            <animate attributeName="stroke-dashoffset" from="28.2681" to="0" begin="1.2s" dur="1s" fill="freeze" />
          </line>
          <line x1="12.0603" y1="28.2681" x2="12.0603" y2="5.88483" stroke="currentColor" strokeDasharray="28.2681 28.2681" strokeDashoffset="28.2681" className="dropper">
            <animate attributeName="stroke-dashoffset" from="28.2681" to="0" begin="0.9s" dur="1s" fill="freeze" />
          </line>


          <line x1="22.8496" y1="28.2681" x2="22.8496" y2="9.91059" stroke="currentColor" strokeDasharray="28.2681 28.2681" strokeDashoffset="28.2681" className="dropper">
            <animate attributeName="stroke-dashoffset" from="28.2681" to="0" begin="0.6s" dur="1s" fill="freeze" />
          </line>
          <line x1="33.6387" y1="28.2681" x2="33.6387" y2="12.8092" stroke="currentColor" strokeDasharray="28.2681 28.2681" strokeDashoffset="28.2681" className="dropper">
            <animate attributeName="stroke-dashoffset" from="28.2681" to="0" begin="0.3s" dur="1s" fill="freeze" />
          </line>
          <line x1="44.4277" y1="28.2681" x2="44.4277" y2="13.7753" stroke="currentColor" strokeDasharray="28.2681 28.2681"  strokeDashoffset="28.2681" className="dropper">

            <animate attributeName="stroke-dashoffset" from="28.2681" to="0" begin="0s" dur="1s" fill="freeze" />
          </line>
          <line x1="55.2168" y1="28.2681" x2="55.2168" y2="13.7754" stroke="currentColor" strokeDasharray="28.2681 28.2681" strokeDashoffset="28.2681" className="dropper">

            <animate attributeName="stroke-dashoffset" from="28.2681" to="0" begin="0s" dur="1s" fill="freeze" />
          </line>

          <line x1="66.0059" y1="28.2681" x2="66.0059" y2="12.8092" stroke="currentColor" strokeDasharray="28.2681 28.2681" strokeDashoffset="28.2681" className="dropper">
            <animate attributeName="stroke-dashoffset" from="28.2681" to="0" begin="0.3s" dur="1s" fill="freeze" />
          </line>

          <line x1="76.7949" y1="28.2681" x2="76.7949" y2="9.91061" stroke="currentColor" strokeDasharray="28.2681 28.2681" strokeDashoffset="28.2681" className="dropper">
            <animate attributeName="stroke-dashoffset" from="28.2681" to="0" begin="0.6s" dur="1s" fill="freeze" />
          </line>
          <line x1="87.584" y1="28.2681" x2="87.584" y2="5.72382" stroke="currentColor" strokeDasharray="28.2681 28.2681" strokeDashoffset="28.2681" className="dropper">
            <animate attributeName="stroke-dashoffset" from="28.2681" to="0" begin="0.9s" dur="1s" fill="freeze" />
          </line>
          <line x1="92.8975" y1="28.2682" x2="92.8975" y2="0.731895" stroke="currentColor" strokeDasharray="28.2681 28.2681" strokeDashoffset="28.2681" className="dropper">
            <animate attributeName="stroke-dashoffset" from="28.2681" to="0" begin="1.5s" dur="1s" fill="freeze" />
          </line>
          <line x1="97.8896" y1="28.2681" x2="97.8896" y2="5.72384" stroke="currentColor" strokeDasharray="28.2681 28.2681" strokeDashoffset="28.2681" className="dropper">
            <animate attributeName="stroke-dashoffset" from="28.2681" to="0" begin="1.2s" dur="1s" fill="freeze" />
          </line>
        </g>
      </svg>
      {!noLabel && 
        <p className="font-bold relative" style={{ fontWeight: 'bold' }}>Loading</p>
      }
    </span>
  )
}

export default LoaderVane;

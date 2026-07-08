import {  useNavigation } from "@remix-run/react"; // Correct import
import {useLoader} from "~/components/loaders/LoaderContext";
import {useEffect} from 'react';
import MoveRight from "~/assets/svg/common/move-right.svg?react";
import {useTranslation} from 'react-i18next';

const LinkCard = ({index,header,description,link,image,additionalClasses }:{index:number, header:string, description:string,link:string, image:string, additionalClasses:string }) => {

  const {t} = useTranslation();

  const handleCardClick = () => {
    window.open(link, "_blank");
  };

  return(
    <div key={"card_"+index}  onClick={handleCardClick} className={`relative ${additionalClasses} border border-gray-light shadow-md rounded-xl flex flex-col justify-end items-start p-4 overflow-hidden group bg-center bg-no-repeat bg-cover cursor-pointer`} style={{ backgroundImage: `url(${image})` }}>
      <div className="absolute top-0 left-0 w-full h-full bg-black/20 group-hover:bg-black/0 transition-all duration-300 backdrop-blur-sm"></div>
      <h2 className="text-secondary z-10">{t(header)}</h2>
      <span className="w-auto h-auto flex flex-row justify-start items-center gap-x-4 text-gray-light z-10 opacity-0 group-hover:opacity-100 -translate-x-[100%] group-hover:translate-x-[0] duration-[1s] transition-translate  hover:underline">
        <h5>{t(description)}</h5>
        <MoveRight className='text-secondary h-10 w-10'/>
      </span>
    </div>
  )
}

const links:{ header:string, description:string,link:string, image:string, additionalClasses:string }[] = [
  {
    header:"home.card_header_1",
    description:"home.card_description_1",
    link:"https://www.linkedin.com/showcase/gelly-consulting-training-mobility",
    image: process.env.NODE_ENV === "production" ? "/images/catenary.jpg" : "/public/images/catenary.jpg" ,
    additionalClasses:"col-span-2 row-span-1", 
  },
  {
    header:"home.card_header_2",
    description:"home.card_description_2",
    link:"/documentation",
    image: process.env.NODE_ENV === "production" ? "/images/documentation.jpg" : "/public/images/documentation.jpg" ,
    additionalClasses:"col-span-1 row-span-1", 
  },
  {
    header:"home.card_header_3",
    description:"home.card_description_3",
    link:"https://www.gellyconsulting.com",
    image: process.env.NODE_ENV === "production" ? "/images/gelly.jpeg" : "/public/images/gelly.jpeg",
    additionalClasses:"col-span-1 row-span-1", 
  }
]


export default function MainDashboard(){

  const { showLoader, hideLoader } = useLoader();

  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === "loading") {
      showLoader();
    } else {
      hideLoader();
    }
  }, [navigation.state]);

  //https://www.gellyconsulting.com/pagina-inicial-es/
  return(
    <>
      {links.map((link,index)=>{
	return(
	  <LinkCard key={"home_card_"+index} index={index} header={link.header} description={link.description} image={link.image} link={link.link} additionalClasses={link.additionalClasses} />
	)
      })}
    </>
  );
}


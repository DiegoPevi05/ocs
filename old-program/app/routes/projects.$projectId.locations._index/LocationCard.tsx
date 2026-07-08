import Eye from "~/assets/svg/common/eye.svg?react"
import CircleX from "~/assets/svg/common/circle-x.svg?react"
import DownloadIcon from "~/assets/svg/common/download.svg?react"

import {useCallback, useState} from "react";
import Modal from "~/components/Modal";
import Button from "~/components/Button";
import SvgComponent from "~/components/SvgComponent";
import {useTranslation} from "react-i18next";

interface LocationCard {
  location:LocationParams;
  onHandler:(locationId:number)=>void;
  openHandler:(locationId:number)=>void;
  onDelete:(locationId:number)=>void;
  onDownload:(type:string,value:string)=>void;
  index:number;
}

const LocationCard = (props:LocationCard) => {
  const {t} = useTranslation();
  const { location, onHandler, openHandler, onDelete, onDownload, index } = props;

  const onHandlerLocation = useCallback(() => {
    if(location.id){
      onHandler(location.id)
    }
  },[location.id,onHandler])

  const onOpenLocation = useCallback(() => {
    if(location.id){
      openHandler(location.id)
    }
  },[location.id,openHandler])

  const onDeleteLocation = useCallback(() => {
    if(location.id){
      onDelete(location.id)
    }
  },[location.id,onDelete])

  const onDownloadLocation = useCallback(() => {
    if(location.external_id){
      onDownload({location_id:location.id,external_id:location.external_id})
    }
  },[location.id,onDownload])
  
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

  const toggleDeleteModal = () => {
    setOpenDeleteModal(!openDeleteModal);
  }


  return(
    <>
      <div onClick={onHandlerLocation} key={`location-${location.id}-${index}`} className="border border-2 border-gray-light rounded-xl flex flex-col sm:flex-row justify-start items-start w-full h-auto p-4 duration-300 hover:bg-primary group animation-element slide-in-up bg-white cursor-pointer">
        <div className="flex flex-row h-auto w-full gap-x-2">
          <div className="w-20 h-full p-1 sm:p-4 flex justify-center items-center group-active:scale-95 duration-300 text-body group-hover:text-white">
            <SvgComponent icon={"location"}/>
          </div>
          <div className="w-full sm:w-auto h-full flex flex-col justify-start items-start gap-y-1 text-body group-hover:text-white capitalize">
            <div className="flex flex-row gap-x-2">
              <p>{t("location.name")}:</p>
              <p className="font-bold">{location.external_id}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("location.fields.vias")}:</p>
              <p className="font-bold">{location.vias.length}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("location.fields.poles")}:</p>
              <p className="font-bold">{location.vias.reduce((acc,via)=>acc+via.poles.length,0)}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("location.fields.vanes")}:</p>
              <p className="font-bold">{location.vanes.length}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("location.fields.cantilevers")}:</p>
              <p className="font-bold">{location.vias.reduce((acc,via)=>acc+(via.poles.reduce((sum, pole) => sum + pole.cantilevers.length,0)),0)}</p>
            </div>
          </div>
          <div className="max-sm:hidden w-auto h-full flex flex-col justify-start items-start gap-y-1 text-body group-hover:text-white ml-12 capitalize">
            <div className="flex flex-row gap-x-2">
              <p>{t("location.fields.updatedAt")}:</p>
              <p className="font-bold">{`${location.updatedAt.toString().split("T")[0] }`}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("pole.fields.createdBy")}:</p>
              <p className="font-bold">{location.created_by}</p>
            </div>
          </div>
        </div>
        <div className="ml-auto max-sm:mt-2 w-auto h-full flex flex-col items-center justify-center sm:gap-y-2 text-body group-hover:text-white">
          <p className="font-bold max-sm:hidden">{t("pole.actions")}</p>
          <div className="w-auto flex flex-row justify-center gap-x-2">
            <span onClick={onOpenLocation} className="w-auto h-auto hover:bg-white hover:text-primary duration-300 p-2 rounded-full active:scale-95 cursor-pointer">
              <Eye className="w-6 h-6"/>
            </span>

            <span onClick={toggleDeleteModal} className="w-auto h-auto hover:bg-white hover:text-primary duration-300 p-2 rounded-full active:scale-95 cursor-pointer">
              <CircleX className="w-6 h-6"/>
            </span>

            <span onClick={onDownloadLocation} className="w-auto h-auto hover:bg-white hover:text-primary duration-300 p-2 rounded-full active:scale-95 cursor-pointer">
              <DownloadIcon className="w-6 h-6"/>
            </span>
        </div>
      </div>
    </div>
    <Modal key={`modal-delete-${location.id}`} isOpen={openDeleteModal} onClose={toggleDeleteModal}>
      <div  className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 gap-y-4">
        <div className="w-36 h-36 p-2 flex justify-center items-center active:scale-95 duration-300 text-body">
          <SvgComponent icon="location"/>
        </div>
        <p className="text-primary text-lg font-bold">{t("location.delete_message")}</p>
        <div className="w-full h-auto gap-x-4 flex items-center justify-center capitalize">
          <Button onClick={toggleDeleteModal} className="capitalize px-6">{t("common.cancel")}</Button>
          <Button onClick={onDeleteLocation} className="capitalize px-6">{t("common.delete")}</Button>
        </div>
      </div>
    </Modal>
    </>
  )
}

export default LocationCard

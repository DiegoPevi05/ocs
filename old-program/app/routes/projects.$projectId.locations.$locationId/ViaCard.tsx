import {useCallback, useState} from "react";
import SvgComponent from "~/components/SvgComponent";
import CircleX from "~/assets/svg/common/circle-x.svg?react"
import DownloadIcon from "~/assets/svg/common/download.svg?react"
import Modal from "~/components/Modal";
import Button from "~/components/Button";
import {useTranslation} from "react-i18next";

interface ViaCardProps {
  via:ViaParams;
  onHandler:(viaId:number)=>void;
  onDelete:(viaId:number)=>void;
  onDownload:(type:string,value:string,type_report:string, revision:string)=>void;
  index:number;
}

const ViaCard = (props:ViaCardProps) => {
  const {t} = useTranslation();
  const { via, onHandler,onDelete, onDownload, index } = props;

  const onHandlerVia = useCallback(() => {
    if(via.id){
      onHandler(via.id)
    }
  },[via.id,onHandler])

  const onDeleteVia = useCallback(() => {
    if(via.id){
      onDelete(via.id)
    }

    setOpenDeleteModal(false);
  },[via.id,onDelete])

  const onDownloadVia = useCallback(() => {
    if(via.id){
      onDownload("via_id",via.id,"7","01")
    }
  },[via.id,onDownload])
  
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

  const toggleDeleteModal = () => {
    setOpenDeleteModal(!openDeleteModal);
  }


  return(
    <>
    <div onClick={onHandlerVia} key={`via-${via.id}-${index}`} className="border border-2 border-gray-light rounded-xl flex flex-col sm:flex-row justify-start items-center w-full h-auto p-4 duration-300 hover:bg-primary group animation-element slide-in-up bg-white cursor-pointer">
        <div className="flex flex-row h-auto items-center w-full gap-x-2">
          <div className="w-12 h-full p-1 flex justify-center items-center group-active:scale-95 duration-300 text-body group-hover:text-white">
            <SvgComponent icon={"via"}/>
          </div>
          <div className="w-full h-full flex flex-row justify-start items-center gap-x-4 text-body group-hover:text-white capitalize">
            <div className="flex flex-row gap-x-2">
              <p>{t("via.name")}:</p>
              <p className="font-bold">{via.external_id}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("via.fields.poles")}:</p>
              <p className="font-bold">{via.poles.length}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("via.fields.vanes")}:</p>
              <p className="font-bold">{via.vanes.length}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("via.fields.cantilevers")}:</p>
              <p className="font-bold">{via.poles.reduce((sum, pole) => sum + pole.cantilevers.length,0)}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("via.fields.updatedAt")}:</p>
              <p className="font-bold">{`${via.updatedAt.toString().split("T")[0] }`}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("via.fields.createdBy")}:</p>
              <p className="font-bold">{via.created_by}</p>
            </div>
          </div>
        </div>
        <div className="ml-auto max-sm:mt-2 w-auto h-full flex flex-col items-center justify-center sm:gap-y-2 text-body group-hover:text-white">
          <p className="font-bold max-sm:hidden capitalize">{t("pole.actions")}</p>
          <div className="w-auto flex flex-row justify-center gap-x-2">
            <span onClick={toggleDeleteModal} className="w-auto h-auto hover:bg-white hover:text-primary duration-300 p-2 rounded-full active:scale-95 cursor-pointer">
              <CircleX className="w-6 h-6"/>
            </span>

            <span onClick={onDownloadVia} className="w-auto h-auto hover:bg-white hover:text-primary duration-300 p-2 rounded-full active:scale-95 cursor-pointer">
              <DownloadIcon className="w-6 h-6"/>
            </span>
        </div>
      </div>
    </div>
    <Modal key={`modal-delete-${via.id}`} isOpen={openDeleteModal} onClose={toggleDeleteModal}>
      <div  className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 gap-y-4">
        <div className="w-36 h-36 p-2 flex justify-center items-center active:scale-95 duration-300 text-body">
          <SvgComponent icon="via"/>
        </div>
        <p className="text-primary text-lg font-bold">{t("via.delete_message")}</p>
        <div className="w-full h-auto gap-x-4 flex items-center justify-center capitalize">
          <Button onClick={toggleDeleteModal} className="capitalize px-6">{t("common.cancel")}</Button>
          <Button onClick={onDeleteVia} className="capitalize px-6">{t("common.delete")}</Button>
        </div>
      </div>
    </Modal>
    </>
  )
}

export default ViaCard;

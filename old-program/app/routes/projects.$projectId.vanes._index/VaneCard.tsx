import Eye from "~/assets/svg/common/eye.svg?react"
import CircleX from "~/assets/svg/common/circle-x.svg?react"
import DownloadIcon from "~/assets/svg/common/download.svg?react"

import {useCallback, useState} from "react";
import Modal from "~/components/Modal";
import Button from "~/components/Button";
import SvgComponent from "~/components/SvgComponent";
import {useTranslation} from "react-i18next";

interface VaneCard {
  vane:VaneParams;
  onHandler:(vaneId:number)=>void;
  openHandler:(vaneId:number)=>void;
  onDelete:(vaneId:number)=>void;
  onDownload:(type:string,value:string)=>void;
  index:number;
}

const VaneCard = (props:VaneCard) => {
  const {t} = useTranslation();
  const { vane, onHandler, openHandler, onDelete, onDownload, index } = props;

  const onHandlerVane = useCallback(() => {
    if(vane.id){
      onHandler(vane.id)
    }
  },[vane.id,onHandler])

  const onOpenVane = useCallback(() => {
    if(vane.id){
      openHandler(vane.id)
    }
  },[vane.id,openHandler])

  const onDeleteVane = useCallback(() => {
    if(vane.id){
      onDelete(vane.id)
    }
  },[vane.id,onDelete])

  const onDownloadVane = useCallback(() => {
    if(vane.external_id){
      onDownload("external_id",vane.external_id)
    }
  },[vane.id,onDownload])
  
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

  const toggleDeleteModal = () => {
    setOpenDeleteModal(!openDeleteModal);
  }

  return(
    <>
      <div onClick={onHandlerVane} key={`vane-${vane.id}-${index}`} className="border border-2 border-gray-light rounded-xl flex flex-row justify-start items-start w-full h-auto p-4 duration-300 hover:bg-primary group animation-element slide-in-up bg-white cursor-pointer">
        <div className="w-24 h-full p-4 flex justify-center items-center group-active:scale-95 duration-300 text-body group-hover:text-white">
          <SvgComponent icon={vane.params.model.icon ?? "vane"}/>
        </div>
        <div className="w-auto h-full flex flex-col justify-start items-start gap-y-1 text-body group-hover:text-white capitalize">
          <div className="flex flex-row gap-x-2">
            <p>{t("vane.name")}:</p>
            <p className="font-bold">{vane.external_id}</p>
          </div>
          <div className="flex flex-row gap-x-2">
            <p>{t("vane.fields.location")}:</p>
            <p className="font-bold">{vane.location}</p>
          </div>
          <div className="flex flex-row gap-x-2">
            <p>{t("vane.fields.createdBy")}:</p>
            <p className="font-bold">{vane.created_by}</p>
          </div>
        </div>
        <div className="w-auto h-full flex flex-col justify-start items-start gap-y-1 text-body group-hover:text-white ml-12 capitalize">
          <div className="flex flex-row gap-x-2">
            <p>{t("vane.fields.params.model.name")}:</p>
            <p className="font-bold">{vane.params.model.name}</p>
          </div>
          <div className="flex flex-row gap-x-2">
            <p>{t("vane.fields.params.model.type.configuration")}:</p>
            <p className="font-bold">{vane.params.model.type.configuration}</p>
          </div>
          <div className="flex flex-row gap-x-2">
            <p>{t("vane.fields.updatedAt")}:</p>
            <p className="font-bold">{`${vane.updatedAt.toString().split("T")[0] }`}</p>
          </div>
        </div>
        <div className="ml-auto w-auto h-full flex flex-col items-center justify-center gap-y-2 text-body group-hover:text-white">
          <p className="font-bold">{t("vane.actions")}</p>
          <div className="w-auto flex flex-row justify-center gap-x-2">
            <span onClick={onOpenVane} className="w-auto h-auto hover:bg-white hover:text-primary duration-300 p-2 rounded-full active:scale-95 cursor-pointer">
              <Eye className="w-6 h-6"/>
            </span>

            <span onClick={toggleDeleteModal} className="w-auto h-auto hover:bg-white hover:text-primary duration-300 p-2 rounded-full active:scale-95 cursor-pointer">
              <CircleX className="w-6 h-6"/>
            </span>

            <span onClick={onDownloadVane} className="w-auto h-auto hover:bg-white hover:text-primary duration-300 p-2 rounded-full active:scale-95 cursor-pointer">
              <DownloadIcon className="w-6 h-6"/>
            </span>
        </div>
      </div>
    </div>
    <Modal key={`modal-delete-${vane.id}`} isOpen={openDeleteModal} onClose={toggleDeleteModal}>
      <div  className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 gap-y-4">
        <div className="w-36 h-36 p-2 flex justify-center items-center active:scale-95 duration-300 text-body">
          <SvgComponent icon="vane"/>
        </div>
        <p className="text-primary text-lg font-bold">{t("vane.delete_message")}</p>
        <div className="w-full h-auto gap-x-4 flex items-center justify-center capitalize">
          <Button onClick={toggleDeleteModal} className="capitalize px-6">{t("common.cancel")}</Button>
          <Button onClick={onDeleteVane} className="capitalize px-6">{t("common.delete")}</Button>
        </div>
      </div>
    </Modal>
    </>
  )
}

export default VaneCard

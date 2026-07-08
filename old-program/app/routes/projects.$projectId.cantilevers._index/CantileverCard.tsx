import Eye from "~/assets/svg/common/eye.svg?react"
import CircleX from "~/assets/svg/common/circle-x.svg?react"
import DownloadIcon from "~/assets/svg/common/download.svg?react"

import {useCallback, useState} from "react";
import Modal from "~/components/Modal";
import Button from "~/components/Button";
import SvgComponent from "~/components/SvgComponent";
import {useTranslation} from "react-i18next";

interface CantileverCard {
  cantilever:CantileverParams;
  onHandler:(cantileverId:number)=>void;
  openHandler:(cantileverId:number)=>void;
  onDelete:(cantileverId:number)=>void;
  onDownload:(type:string,value:string)=>void;
  index:number;
}

const CantileverCard = (props:CantileverCard) => {
  const {t} = useTranslation();
  const { cantilever, onHandler, openHandler, onDelete, onDownload, index } = props;

  const onHandlerCantilever = useCallback(() => {
    if(cantilever.id){
      onHandler(cantilever.id)
    }
  },[cantilever.id,onHandler])

  const onOpenCantilever = useCallback(() => {

    if(cantilever.id){
      openHandler(cantilever.id)
    }
  },[cantilever.id,openHandler])

  const onDeleteCantilever = useCallback(() => {
    if(cantilever.id){
      onDelete(cantilever.id);
      setOpenDeleteModal(false);
    }
  },[cantilever.id,onDelete])

  const onDownloadCantilever = useCallback(() => {
    if(cantilever.external_id){
      onDownload("external_id",cantilever.external_id)
    }
  },[cantilever.id,onDownload])
  
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

  const toggleDeleteModal = () => {
    setOpenDeleteModal(!openDeleteModal);
  }

  return(
    <>
      <div onClick={onHandlerCantilever} key={`cantilever-${cantilever.id}-${index}`} className="border border-2 border-gray-light rounded-xl flex flex-col sm:flex-row justify-start items-start w-full h-auto p-4 duration-300 hover:bg-primary group animation-element slide-in-up bg-white cursor-pointer">
        <div className="flex flex-row h-auto w-full gap-x-2">
          <div className="w-24 h-full p-1 sm:p-4 flex justify-center items-center group-active:scale-95 duration-300 text-body group-hover:text-white">
            <SvgComponent icon={cantilever.params.model.icon ?? "cantilever_gy_type_1"}/>
          </div>
          <div className="w-full sm:w-auto h-full flex flex-col justify-start items-start gap-y-1 text-body group-hover:text-white capitalize">
            <div className="flex flex-row gap-x-2">
              <p>{t("cantilever.name")}:</p>
              <p className="font-bold">{cantilever.external_id}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("cantilever.fields.pole")}:</p>
              <p className="font-bold">{cantilever.pole}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("cantilever.fields.via")}:</p>
              <p className="font-bold">{cantilever.via}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("cantilever.fields.location")}:</p>
              <p className="font-bold">{cantilever.location}</p>
            </div>
          </div>
          <div className="max-sm:hidden w-auto h-full flex flex-col justify-start items-start gap-y-1 text-body group-hover:text-white ml-12 capitalize">
            <div className="flex flex-row gap-x-2">
              <p>{t("cantilever.fields.params.model.name")}:</p>
              <p className="font-bold">{cantilever.params.model.name}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("cantilever.fields.params.model.type.configuration")}:</p>
              <p className="font-bold">{cantilever.params.model.type.configuration}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("cantilever.fields.updatedAt")}:</p>
              <p className="font-bold">{`${cantilever.updatedAt.toString().split("T")[0] }`}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("cantilever.fields.createdBy")}:</p>
              <p className="font-bold">{cantilever.created_by}</p>
            </div>
          </div>
        </div>
        <div className="ml-auto max-sm:mt-2 w-auto h-full flex flex-col items-center justify-center sm:gap-y-2 text-body group-hover:text-white">
          <p className="font-bold capitalize max-sm:hidden capitalize">{t("cantilever.actions")}</p>
          <div className="w-auto flex flex-row justify-center gap-x-2">
            <span onClick={onOpenCantilever} className="w-auto h-auto hover:bg-white hover:text-primary duration-300 p-2 rounded-full active:scale-95 cursor-pointer">
              <Eye className="w-6 h-6"/>
            </span>

            <span onClick={toggleDeleteModal} className="w-auto h-auto hover:bg-white hover:text-primary duration-300 p-2 rounded-full active:scale-95 cursor-pointer">
              <CircleX className="w-6 h-6"/>
            </span>

            <span onClick={onDownloadCantilever} className="w-auto h-auto hover:bg-white hover:text-primary duration-300 p-2 rounded-full active:scale-95 cursor-pointer">
              <DownloadIcon className="w-6 h-6"/>
            </span>
        </div>
      </div>
    </div>
    <Modal key={`modal-delete-${cantilever.id}`} isOpen={openDeleteModal} onClose={toggleDeleteModal}>
      <div  className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 gap-y-4">
        <div className="w-24 h-24 p-2 flex justify-center items-center active:scale-95 duration-300 text-body">
          <SvgComponent icon="cantilever_gy_type_1"/>
        </div>
        <p className="text-primary text-lg font-bold">{t("cantilever.delete_message")}</p>
        <div className="w-full h-auto gap-x-4 flex items-center justify-center capitalize">
          <Button onClick={toggleDeleteModal} className="capitalize px-6">{t("common.cancel")}</Button>
          <Button onClick={onDeleteCantilever} className="capitalize px-6">{t("common.delete")}</Button>
        </div>
      </div>
    </Modal>
    </>
  )
}

export default CantileverCard

import Eye from "~/assets/svg/common/eye.svg?react"
import CircleX from "~/assets/svg/common/circle-x.svg?react"
import DownloadIcon from "~/assets/svg/common/download.svg?react"
import { serializeCantileversName } from "~/utils/pole";

import {useCallback, useState} from "react";
import Modal from "~/components/Modal";
import Button from "~/components/Button";
import SvgComponent from "~/components/SvgComponent";
import {useTranslation} from "react-i18next";

interface PoleCard {
  pole:PoleParams;
  onHandler:(poleId:number)=>void;
  openHandler:(poleId:number)=>void;
  onDelete:(poleId:number)=>void;
  onDownload:(type:string,value:string)=>void;
  index:number;
}

const PoleCard = (props:PoleCard) => {
  const {t} = useTranslation();
  const { pole, onHandler, openHandler, onDelete, onDownload, index } = props;

  const onHandlerPole = useCallback(() => {
    if(pole.id){
      onHandler(pole.id)
    }
  },[pole.id,onHandler])

  const onOpenPole = useCallback(() => {
    if(pole.id){
      openHandler(pole.id)
    }
  },[pole.id,openHandler])

  const onDeletePole = useCallback(() => {
    if(pole.id){
      onDelete(pole.id)
    }
    setOpenDeleteModal(false);
  },[pole.id,onDelete])

  const onDownloadPole = useCallback(() => {
    if(pole.external_id){
      onDownload("external_id",pole.external_id)
    }
  },[pole.id,onDownload])
  
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

  const toggleDeleteModal = () => {
    setOpenDeleteModal(!openDeleteModal);
  }

  return(
    <>
      <div onClick={onHandlerPole} key={`pole-${pole.id}-${index}`} className="border border-2 border-gray-light rounded-xl flex flex-col sm:flex-row justify-start items-start w-full h-auto p-4 duration-300 hover:bg-primary group animation-element slide-in-up bg-white cursor-pointer">
        <div className="flex flex-row h-auto w-full gap-x-2">
          <div className="w-20 h-full p-1 sm:p-4 flex justify-center items-center group-active:scale-95 duration-300 text-body group-hover:text-white">
            <SvgComponent icon={pole.params.model.icon ?? "pole"}/>
          </div>
          <div className="w-full sm:w-auto h-full flex flex-col justify-start items-start gap-y-1 text-body group-hover:text-white capitalize">
            <div className="flex flex-row gap-x-2">
              <p>{t("pole.name")}:</p>
              <p className="font-bold">{pole.external_id}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("pole.fields.cantilevers")}:</p>
              <p className="font-bold">{serializeCantileversName(pole.cantilevers)}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("pole.fields.via")}:</p>
              <p className="font-bold">{pole.via}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("pole.fields.location")}:</p>
              <p className="font-bold">{pole.location}</p>
            </div>
          </div>
          <div className="max-sm:hidden w-auto h-full flex flex-col justify-start items-start gap-y-1 text-body group-hover:text-white ml-12 capitalize">
            <div className="flex flex-row gap-x-2">
              <p>{t("pole.fields.params.model.type.shape")}:</p>
              <p className="font-bold">{t(`pole.fields.params.model.type.${pole.params.model.type.shape}`)}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("pole.fields.params.model.type.configuration")}:</p>
              <p className="font-bold">{t(`pole.fields.params.model.type.${pole.params.model.type.cantileverConfiguration}`)}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("pole.fields.updatedAt")}:</p>
              <p className="font-bold">{`${pole.updatedAt.toString().split("T")[0] }`}</p>
            </div>
            <div className="flex flex-row gap-x-2">
              <p>{t("pole.fields.createdBy")}:</p>
              <p className="font-bold">{pole.created_by}</p>
            </div>
          </div>
        </div>
        <div className="ml-auto max-sm:mt-2 w-auto h-full flex flex-col items-center justify-center sm:gap-y-2 text-body group-hover:text-white">
          <p className="font-bold max-sm:hidden capitalize">{t("pole.actions")}</p>
          <div className="w-auto flex flex-row justify-center gap-x-2">
            <span onClick={onOpenPole} className="w-auto h-auto hover:bg-white hover:text-primary duration-300 p-2 rounded-full active:scale-95 cursor-pointer">
              <Eye className="w-6 h-6"/>
            </span>

            <span onClick={toggleDeleteModal} className="w-auto h-auto hover:bg-white hover:text-primary duration-300 p-2 rounded-full active:scale-95 cursor-pointer">
              <CircleX className="w-6 h-6"/>
            </span>

            <span onClick={onDownloadPole} className="w-auto h-auto hover:bg-white hover:text-primary duration-300 p-2 rounded-full active:scale-95 cursor-pointer">
              <DownloadIcon className="w-6 h-6"/>
            </span>
        </div>
      </div>
    </div>
    <Modal key={`modal-delete-${pole.id}`} isOpen={openDeleteModal} onClose={toggleDeleteModal}>
      <div  className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 gap-y-4">
        <div className="w-16 h-16 p-2 flex justify-center items-center active:scale-95 duration-300 text-body">
          <SvgComponent icon="pole"/>
        </div>
        <p className="text-primary text-lg font-bold">{t("pole.delete_message")}</p>
        <div className="w-full h-auto gap-x-4 flex items-center justify-center capitalize">
          <Button onClick={toggleDeleteModal} className="capitalize px-6">{t("common.cancel")}</Button>
          <Button onClick={onDeletePole} className="capitalize px-6">{t("common.delete")}</Button>
        </div>
      </div>
    </Modal>
    </>
  )
}

export default PoleCard

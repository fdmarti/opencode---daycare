"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { CloseIcon, InfoIcon, PlusIcon, SendIcon } from "../common/icons/Icons";
import { CustomButton } from "../common/ui/CustomButton";
import { CustomInput, inputLabelClass } from "../common/ui/CustomInput";

const FORM_ID = "link-parent-form";
const TITLE_ID = "link-parent-title";

const REQUIRED_MESSAGE = "Este campo es obligatorio";
const INVALID_EMAIL_MESSAGE = "Introduce un correo válido";

const INVITATION_CODE = "7K4P9";
const INVITATION_EXPIRY_LABEL = "Vence en 7 días";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ParentRole = "Mamá" | "Papá" | "Tutor/a";

export interface LinkParentFormState {
  name: string;
  email: string;
  role: ParentRole;
}

type LinkParentField = "name" | "email";
type LinkParentErrors = Partial<Record<LinkParentField, string>>;

const ROLE_OPTIONS: ParentRole[] = ["Mamá", "Papá", "Tutor/a"];

const EMPTY_FORM: LinkParentFormState = {
  name: "",
  email: "",
  role: "Mamá",
};

const VALIDATED_FIELDS: LinkParentField[] = ["name", "email"];

export function LinkParentModal({ kidName }: { kidName: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fieldRefs = useRef<Partial<Record<LinkParentField, HTMLElement | null>>>({});
  const scrollLock = useRef<{
    body: string;
    container: HTMLElement | null;
    containerOverflow: string;
  } | null>(null);

  const [form, setForm] = useState<LinkParentFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<LinkParentErrors>({});

  const firstName = kidName.split(" ")[0];

  const lockScroll = () => {
    // The page scrolls inside <main>, so the body alone does not stop it.
    const container = dialogRef.current?.closest("main");
    scrollLock.current = {
      body: document.body.style.overflow,
      container: container instanceof HTMLElement ? container : null,
      containerOverflow: container instanceof HTMLElement ? container.style.overflow : "",
    };
    document.body.style.overflow = "hidden";
    if (scrollLock.current.container) {
      scrollLock.current.container.style.overflow = "hidden";
    }
  };

  const unlockScroll = () => {
    document.body.style.overflow = scrollLock.current?.body ?? "";
    const { container, containerOverflow } = scrollLock.current ?? {};
    if (container) container.style.overflow = containerOverflow ?? "";
  };

  const openModal = () => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    lockScroll();
    fieldRefs.current.name?.focus();
  };

  const closeModal = () => {
    dialogRef.current?.close();
  };

  const handleClose = () => {
    unlockScroll();
    setForm(EMPTY_FORM);
    setErrors({});
    triggerRef.current?.focus();
  };

  const updateField = (field: "name" | "email", value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const selectRole = (role: ParentRole) => {
    setForm((current) => ({ ...current, role }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: LinkParentErrors = {};
    if (!form.name.trim()) nextErrors.name = REQUIRED_MESSAGE;
    if (!form.email.trim()) {
      nextErrors.email = REQUIRED_MESSAGE;
    } else if (!EMAIL_PATTERN.test(form.email.trim())) {
      nextErrors.email = INVALID_EMAIL_MESSAGE;
    }

    setErrors(nextErrors);

    const firstInvalid = VALIDATED_FIELDS.find((field) => nextErrors[field]);
    if (firstInvalid) {
      fieldRefs.current[firstInvalid]?.focus();
      return;
    }

    // Nothing is persisted: the invitation is discarded on close.
    closeModal();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openModal}
        className="flex items-center gap-3 pt-2 border-0 bg-transparent cursor-pointer"
      >
        <span className="flex-none w-10 h-10 rounded-full border-[1.5px] border-dashed border-[#D8CBBA] flex items-center justify-center text-foto-tinta">
          <PlusIcon size={18} />
        </span>
        <span className="text-[14.5px] font-extrabold text-acento-editar">
          Vincular otro padre
        </span>
      </button>

      <dialog
        ref={dialogRef}
        onClose={handleClose}
        aria-labelledby={TITLE_ID}
        className="w-[calc(100%-2rem)] max-w-120 max-h-[calc(100dvh-2rem)] m-auto p-0 border-0 bg-transparent backdrop:bg-[rgba(63,54,46,0.25)] overflow-y-auto"
      >
        <div className="w-full bg-[#FBF4EC] border border-borde rounded-3xl shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] overflow-hidden">
          <div className="flex items-center justify-between px-6.5 py-5 border-b border-borde">
            <div>
              <h2
                id={TITLE_ID}
                className="font-display font-semibold text-[18px] text-tinta"
              >
                Vincular padre
              </h2>
              <p className="text-[13px] text-placeholder">a {kidName}</p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              aria-label="Cerrar"
              className="flex-none w-8.5 h-8.5 rounded-[10px] bg-borde-suave text-mute flex items-center justify-center border-0 cursor-pointer"
            >
              <CloseIcon size={18} />
            </button>
          </div>

          <form
            id={FORM_ID}
            onSubmit={handleSubmit}
            noValidate
            className="p-[22px_26px]"
          >
            <div className="flex gap-2.75 bg-[#E3ECFB] rounded-[14px] p-[13px_16px] mb-5">
              <span className="flex-none text-anuncio mt-px">
                <InfoIcon size={20} />
              </span>
              <p className="text-[13.5px] text-[#3F5694] leading-[1.45]">
                Le enviaremos un correo con un código para que active su cuenta.
                Solo verá el feed de {firstName}.
              </p>
            </div>

            <CustomInput
              id="link-parent-name"
              ref={(element) => {
                fieldRefs.current.name = element;
              }}
              type="text"
              label="NOMBRE DEL PADRE/MADRE"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Ej. Diego Fernández"
              error={errors.name}
              className="mb-4.5"
            />

            <CustomInput
              id="link-parent-email"
              ref={(element) => {
                fieldRefs.current.email = element;
              }}
              type="email"
              label="EMAIL"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="correo@ejemplo.com"
              error={errors.email}
              className="mb-4.5"
            />

            <div className="mb-5">
              <p className={inputLabelClass}>PARENTESCO</p>
              <div className="flex gap-2.25">
                {ROLE_OPTIONS.map((role) => (
                  <CustomButton
                    key={role}
                    type="button"
                    variant="chip"
                    selected={form.role === role}
                    aria-pressed={form.role === role}
                    onClick={() => selectRole(role)}
                  >
                    {role}
                  </CustomButton>
                ))}
              </div>
            </div>

            <div className="bg-[#FBF1D6] border-[1.5px] border-dashed border-[#E6D08A] rounded-2xl p-4.5 text-center mb-5">
              <div className="text-[12px] font-extrabold tracking-[0.7px] text-[#A88526] mb-2">
                CÓDIGO DE INVITACIÓN
              </div>
              <div className="font-display font-semibold text-[34px] tracking-[7px] text-[#8A7234]">
                {INVITATION_CODE}
              </div>
              <div className="text-[13px] text-[#A88526] mt-1.5">
                {INVITATION_EXPIRY_LABEL}
              </div>
            </div>

            <CustomButton
              type="submit"
              form={FORM_ID}
              variant="primary"
              size="lg"
              className="flex items-center justify-center gap-2.25"
            >
              <SendIcon size={19} />
              Enviar invitación
            </CustomButton>
          </form>
        </div>
      </dialog>
    </>
  );
}

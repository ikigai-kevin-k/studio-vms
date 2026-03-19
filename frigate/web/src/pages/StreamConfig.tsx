import { ConfirmDialog } from "@/components/stream-config/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { Controller, Path, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

const streamConfigSchema = z.object({
  deviceCode: z.string().min(1, { message: "Required" }),
  cdn: z.array(z.string()),
  domainName: z.array(z.string()),
  location: z.array(z.string()),
  quality: z.array(z.string()).default(["HD", "High", "Medium", "Low"]),
  background: z.array(z.string()),
});

export type StreamConfigFormData = z.infer<typeof streamConfigSchema>;

const url = [
  "https://livepull-tcgi.iki-utl.cc/live/aro0011lo.m3u8",
  "https://livepull-tcgi.iki-utl.cc/live/aro0021lo.m3u8",
  "https://livepull-tcgi.iki-utl.cc/live/asb0011lo.m3u8",
  "https://livepull-tcgi.iki-utl.cc/live/aro0011me_dev.m3u8",
  "https://livepull-tcgi.iki-utl.cc/live/aro0021me_dev.m3u8",
  "https://livepull-tcgi.iki-utl.cc/live/asb0011me_dev.m3u8",
];

function StreamConfig() {
  const { t } = useTranslation(["views/streamConfig"]);

  const { reset, handleSubmit, control } = useForm<StreamConfigFormData>({
    resolver: zodResolver(streamConfigSchema),
    defaultValues: {
      deviceCode: "",
      cdn: [],
      domainName: [],
      location: [],
      quality: ["HD", "High", "Medium", "Low"],
      background: [],
    },
  });

  const [show, setShow] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const dropdownList: {
    label: string;
    value: Path<StreamConfigFormData>;
    options: { label: string; value: string }[];
  }[] = useMemo(
    () => [
      {
        label: t("select.deviceCode"),
        value: "deviceCode",
        options: [
          { label: "SR01", value: "SR01" },
          { label: "SR02", value: "SR02" },
          { label: "VR01", value: "VR01" },
          { label: "VR02", value: "VR02" },
          { label: "SB01", value: "SB01" },
          { label: "SB02", value: "SB02" },
        ],
      },
      {
        label: t("select.cdn"),
        value: "cdn",
        options: [
          { label: "TCGI", value: "TCGI" },
          { label: "TCSRY", value: "TCSRY" },
          { label: "BPGI", value: "BPGI" },
          { label: "BPSRY", value: "BPSRY" },
          { label: "WS", value: "WS" },
          { label: "CDNW", value: "CDNW" },
        ],
      },
      {
        label: t("select.domainName"),
        value: "domainName",
        options: [
          { label: "iki-utl.cc", value: "iki-utl.cc" },
          { label: "novvy-csl.cc", value: "novvy-csl.cc" },
          { label: "csl-neu.net", value: "csl-neu.net" },
          { label: "new-cstl.cc", value: "new-cstl.cc" },
        ],
      },
      {
        label: t("select.location"),
        value: "location",
        options: [
          {
            label: "LIVE",
            value: "LIVE",
          },
          {
            label: "ACADEMY",
            value: "ACADEMY",
          },
        ],
      },
      {
        label: t("select.quality.label"),
        value: "quality",
        options: [
          {
            label: t("select.quality.options.hd"),
            value: "HD",
          },
          {
            label: t("select.quality.options.high"),
            value: "High",
          },
          {
            label: t("select.quality.options.medium"),
            value: "Medium",
          },
          {
            label: t("select.quality.options.low"),
            value: "Low",
          },
        ],
      },
      {
        label: t("select.background"),
        value: "background",
        options: [
          {
            label: "1",
            value: "1",
          },
          {
            label: "2",
            value: "2",
          },
          {
            label: "3",
            value: "3",
          },
        ],
      },
    ],
    [t],
  );
  const onSubmit = handleSubmit(() => {
    setShow(true);
  });

  return (
    <div className="flex size-full flex-col gap-4 overflow-y-auto p-7">
      <form onSubmit={onSubmit}>
        <div className="flex flex-col gap-4">
          <p className="text-2xl font-bold">{t("title")}</p>
          <div className="grid grid-cols-3 gap-4">
            {dropdownList.map((data) => {
              return (
                <Controller
                  key={data.value}
                  name={data.value}
                  control={control}
                  render={({ field, fieldState }) => {
                    return (
                      <div className="flex flex-col gap-1">
                        <MultiSelect
                          title={data.label}
                          options={data.options ?? []}
                          value={field.value ?? []}
                          onChange={field.onChange}
                          placeholder={data.label}
                          hasError={!!fieldState.error}
                        />
                        {fieldState.error && (
                          <span className="ml-1 text-xs text-red-500">
                            {fieldState.error.message}
                          </span>
                        )}
                      </div>
                    );
                  }}
                />
              );
            })}
          </div>
          <div className="flex gap-4 self-end">
            <Button
              className="mt-4 w-20"
              variant="select"
              type="button"
              onClick={() => reset()}
            >
              Reset
            </Button>
            <Button className="mt-4 w-20" variant="select" type="submit">
              Preview
            </Button>
          </div>
        </div>
      </form>
      <div className="grid grid-cols-3 gap-10">
        {show &&
          url.map((data, i) => (
            <video
              key={i}
              preload="auto"
              autoPlay
              playsInline
              muted
              disableRemotePlayback
              loop
              className="h-[250px] w-full"
            >
              <source src={data} type="application/x-mpegURL" />
            </video>
          ))}
      </div>
      {show && (
        <div className="flex gap-4 self-end">
          <Button
            className="mt-4 w-20"
            variant="select"
            type="button"
            onClick={() => reset()}
          >
            Cancel
          </Button>
          <Button
            className="mt-4 w-20"
            variant="select"
            type="button"
            onClick={() => setConfirm(true)}
          >
            Confirm
          </Button>
        </div>
      )}
      <ConfirmDialog
        isOpen={confirm}
        onClose={() => setConfirm(false)}
        onSave={() => setConfirm(false)}
      />
    </div>
  );
}

export default StreamConfig;

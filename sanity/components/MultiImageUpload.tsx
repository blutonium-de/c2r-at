"use client"

import {useRef, useState} from "react"
import type {ChangeEvent} from "react"
import {
  type ArrayOfObjectsInputProps,
  insert,
  setIfMissing,
  useClient,
} from "sanity"

type ProductImage = {
  _type: "image"
  _key: string
  asset: {
    _type: "reference"
    _ref: string
  }
}

export function MultiImageUpload(
  props: ArrayOfObjectsInputProps
) {
  const client = useClient({apiVersion: "2025-02-19"})

  const fileInput = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState("")

  async function handleFiles(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files || [])

    if (!files.length) return

    setUploading(true)

    const uploadedImages: ProductImage[] = []
    let failed = 0

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        setProgress(
          `Bild ${i + 1} von ${files.length} wird hochgeladen ...`
        )

        try {
          const asset = await client.assets.upload("image", file, {
            filename: file.name,
          })

          uploadedImages.push({
            _type: "image",
            _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
            asset: {
              _type: "reference",
              _ref: asset._id,
            },
          })
        } catch (error) {
          failed++
          console.error("Bild konnte nicht hochgeladen werden:", error)
        }
      }

      if (uploadedImages.length) {
        props.onChange([
          setIfMissing([]),
          insert(uploadedImages, "after", [-1]),
        ])
      }

      setProgress(
        `${uploadedImages.length} Bild(er) hinzugefügt.` +
          (failed ? ` ${failed} fehlgeschlagen.` : "")
      )
    } catch (error) {
      console.error(error)
      setProgress("Beim Hochladen ist ein Fehler aufgetreten.")
    } finally {
      setUploading(false)

      if (fileInput.current) {
        fileInput.current.value = ""
      }
    }
  }

  return (
    <div>
      <div
        style={{
          padding: 16,
          marginBottom: 16,
          border: "1px solid #ddd",
          borderRadius: 10,
          background: "#f7f7f7",
        }}
      >
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={handleFiles}
          style={{display: "none"}}
        />

        <button
          type="button"
          disabled={uploading || props.readOnly}
          onClick={() => fileInput.current?.click()}
          style={{
            background: "#111",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 8,
            border: 0,
            cursor: uploading ? "wait" : "pointer",
            fontWeight: 600,
            width: "100%",
          }}
        >
          {uploading
            ? "Bilder werden hochgeladen ..."
            : "📸 Mehrere Produktbilder hochladen"}
        </button>

        {progress && (
          <p style={{fontSize: 13, marginTop: 10}}>
            {progress}
          </p>
        )}
      </div>

      {props.renderDefault(props)}
    </div>
  )
}
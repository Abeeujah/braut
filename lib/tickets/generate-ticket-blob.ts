import type { ChildWithTicket } from "./queries"

const HOUSE_IMAGES: Record<string, string> = {
  Love: "/tickets/House of Love.jpg",
  Joy: "/tickets/House of Joy.jpg",
  Hope: "/tickets/House of Hope.jpg",
  Peace: "/tickets/House of Peace.jpg",
}

export async function generateTicketBlob(
  child: ChildWithTicket
): Promise<Blob | null> {
  if (!child.ticket) return null

  try {
    const ticketImage = HOUSE_IMAGES[child.house || "Love"]
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    const img = new Image()
    img.crossOrigin = "anonymous"

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = ticketImage
    })

    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)

    const W = img.width
    const H = img.height

    ctx.fillStyle = "#000000"
    ctx.textBaseline = "top"

    // Stub - Ticket Number
    ctx.font = `bold ${Math.round(H * 0.055)}px Arial`
    ctx.fillText(child.ticket.ticket_number, W * 0.08, H * 0.24)

    // Stub - Name
    ctx.font = `bold ${Math.round(H * 0.056)}px Arial`
    const name = child.name
    const spaceIndex = name.indexOf(" ")
    const hasSpace = spaceIndex !== -1
    const lines: string[] = []

    if (hasSpace) {
      const firstName = name.substring(0, spaceIndex)
      const lastName = name.substring(spaceIndex + 1)
      if (firstName.length > 17) {
        lines.push(firstName.substring(0, 15) + "...")
        lines.push(
          lastName.length > 17 ? lastName.substring(0, 15) + "..." : lastName
        )
      } else if (lastName.length > 17) {
        lines.push(firstName)
        lines.push(lastName.substring(0, 15) + "...")
      } else if (name.length > 17) {
        lines.push(firstName)
        lines.push(lastName)
      } else {
        lines.push(name)
      }
    } else {
      lines.push(name.length > 17 ? name.substring(0, 15) + "..." : name)
    }

    const fontSize = Math.round(H * 0.056)
    const lineHeight = fontSize * 1.2
    lines.forEach((line, index) => {
      ctx.fillText(line, W * 0.073, H * 0.6 + index * lineHeight)
    })

    // Main - Ticket Number
    ctx.font = `bold ${Math.round(H * 0.075)}px Arial`
    ctx.fillText(child.ticket.ticket_number, W * 0.61, H * 0.35)

    // Main - Name
    ctx.font = `bold ${Math.round(H * 0.075)}px Arial`
    const mainName = name.length > 22 ? name.substring(0, 22) + "..." : name
    ctx.fillText(mainName, W * 0.57, H * 0.52)

    // Draw Photo
    if (child.photo_url) {
      const photoImg = new Image()
      photoImg.crossOrigin = "anonymous"
      try {
        await new Promise<void>((resolve, reject) => {
          photoImg.onload = () => resolve()
          photoImg.onerror = reject
          photoImg.src = child.photo_url!
        })

        const polaroidX = W * 0.32
        const polaroidY = H * 0.2
        const polaroidW = W * 0.15
        const polaroidH = H * 0.58
        const photoPadding = polaroidW * 0.0001
        const photoX = polaroidX + photoPadding
        const photoY = polaroidY + photoPadding
        const photoW = polaroidW - photoPadding * 2
        const photoH = polaroidH - photoPadding * 2

        ctx.save()
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(polaroidX, polaroidY, polaroidW, polaroidH)

        const imgAspect = photoImg.naturalWidth / photoImg.naturalHeight
        const rectAspect = photoW / photoH
        let sX, sY, sW, sH

        if (imgAspect > rectAspect) {
          sH = photoImg.naturalHeight
          sW = sH * rectAspect
          sX = (photoImg.naturalWidth - sW) / 2
          sY = 0
        } else {
          sW = photoImg.naturalWidth
          sH = sW / rectAspect
          sX = 0
          sY = (photoImg.naturalHeight - sH) / 2
        }

        ctx.drawImage(photoImg, sX, sY, sW, sH, photoX, photoY, photoW, photoH)
        ctx.restore()
      } catch (e) {
        console.warn("Could not load child photo:", child.name)
      }
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", 1.0)
    })
  } catch (err) {
    console.error(`Error generating ticket for ${child.name}`, err)
    return null
  }
}

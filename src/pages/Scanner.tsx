import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../store/store'
import { resolveScannedValue, resetScan } from '../store/scanSlice'
import { BrowserMultiFormatReader } from '@zxing/browser'
import type { Result } from '@zxing/library'

export default function Scanner() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const scanState = useSelector((s: RootState) => s.scan)

  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)

  const [cameraReady, setCameraReady] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [lastValue, setLastValue] = useState<string | null>(null)
  const [sameCount, setSameCount] = useState(0)

  const chooseBackCamera = async (): Promise<string | undefined> => {
    const list = (BrowserMultiFormatReader as any).listVideoInputDevices
    const devices: MediaDeviceInfo[] = list ? await list() : []
    if (!devices || devices.length === 0) return undefined
    const back =
      devices.find((d) => /back|rear|environment/i.test(d.label)) || devices[0]
    return back.deviceId
  }

  const startCamera = async () => {
    try {
      setErrorMsg(null)
      readerRef.current = new BrowserMultiFormatReader()
      const deviceId = await chooseBackCamera()

      controlsRef.current = await readerRef.current.decodeFromVideoDevice(
        deviceId ?? null,
        videoRef.current!,
        (result: Result | undefined) => {
          if (result) {
            const text = result.getText().trim()
            if (text === lastValue) {
              const next = sameCount + 1
              setSameCount(next)
              if (next >= 2) dispatch(resolveScannedValue(text))
            } else {
              setLastValue(text)
              setSameCount(1)
            }
          }
        }
      )
      setCameraReady(true)
    } catch (e) {
      setErrorMsg('Camera unavailable or permission denied. Use image upload.')
    }
  }

  const stopCamera = () => {
    try { controlsRef.current?.stop() } catch {}
    const stream = videoRef.current?.srcObject as MediaStream | null
    stream?.getTracks().forEach((t) => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
  }

  const handleFileUpload = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]
    if (!file) return
    try {
      const url = URL.createObjectURL(file)
      const r = new BrowserMultiFormatReader()
      const img = new Image()
      const decoded = await new Promise<string>((resolve, reject) => {
        img.onload = async () => {
          try {
            const res = await r.decodeFromImageElement(img as HTMLImageElement)
            resolve(res.getText())
          } catch (err) { reject(err) } finally { URL.revokeObjectURL(url) }
        }
        img.onerror = reject
      })
      img.src = url
      dispatch(resolveScannedValue(decoded))
    } catch {
      setErrorMsg('Could not decode image. Try a clearer QR.')
    }
  }

  useEffect(() => {
    if (scanState.status === 'success' && scanState.selectedProductId) {
      stopCamera()
      navigate(`/product/${scanState.selectedProductId}`)
    }
  }, [scanState.status, scanState.selectedProductId, navigate])

  useEffect(() => {
    dispatch(resetScan())
    startCamera()
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="scanner-page">
      <div className="container">
        <header className="scanner-header">
          <button onClick={() => navigate('/')} className="back-button">← Back</button>
          <h1>Scan QR Code</h1>
        </header>

        <div className="scanner-content">
          <div className="camera-container">
            <div className="video-wrapper">
              <video ref={videoRef} className="scanner-video" muted autoPlay playsInline />
              <div className="scan-overlay"><div className="scan-box" /></div>
            </div>
          </div>

          {!cameraReady && (
            <div className="no-camera"><p>Initializing camera…</p></div>
          )}

          <div className="upload-section">
            <p>Or upload a QR image (PNG/JPG):</p>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="file-input" />
            <button className="upload-button">📁 Choose Image
              <input type="file" accept="image/*" onChange={handleFileUpload} className="file-input" style={{ display: 'none' }} />
            </button>
          </div>

          {scanState.status === 'decoding' && <div className="scan-status"><p>Decoding…</p></div>}
          {(scanState.status === 'error' || errorMsg) && (
            <div className="scan-error">
              <p>{scanState.error === 'product_not_found' ? 'Product not found. Try a supported QR.' : (errorMsg ?? 'Scan error')}</p>
              <button onClick={() => dispatch(resetScan())} className="retry-button">Try Again</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
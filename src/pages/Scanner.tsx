import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../store/store'
import { resolveScannedValue, resetScan } from '../store/scanSlice'
import { BrowserMultiFormatReader, BrowserQRCodeReader } from '@zxing/browser'
import type { Result } from '@zxing/library'

export default function Scanner() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const scanState = useSelector((s: RootState) => s.scan)

  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const readerRef = useRef<BrowserQRCodeReader | null>(null)

  const [cameraReady, setCameraReady] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const startCamera = async () => {
    try {
      setErrorMsg(null)
      setCameraReady(false)
      
      console.log('Initializing camera...')
      
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser')
      }
      
      // Create a new QR code reader
      const codeReader = new BrowserQRCodeReader()
      readerRef.current = codeReader
      
      // Set a timeout for camera initialization
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Camera initialization timeout')), 10000)
      })
      
      const initCamera = async () => {
        console.log('Requesting camera permissions...')
        
        // Try to get camera stream with timeout
        let stream: MediaStream | null = null
        
        try {
          // Try back camera first
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          })
          console.log('Back camera permission granted')
        } catch (permError) {
          console.log('Back camera not available, trying front camera')
          try {
            stream = await navigator.mediaDevices.getUserMedia({ 
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            })
            console.log('Front camera permission granted')
          } catch (frontError) {
            throw new Error('Camera permission denied or no camera available')
          }
        }
        
        if (stream) {
          // Stop the permission test stream
          stream.getTracks().forEach(track => track.stop())
        }
        
        // Get available video devices
        const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices()
        console.log('Available cameras:', videoInputDevices.length, videoInputDevices.map(d => ({ id: d.deviceId, label: d.label })))
        
        if (videoInputDevices.length === 0) {
          throw new Error('No camera devices found')
        }

        // Choose the best camera (prefer back camera)
        let selectedDeviceId = videoInputDevices[0].deviceId
        const backCamera = videoInputDevices.find(device => 
          /back|rear|environment/i.test(device.label)
        )
        if (backCamera) {
          selectedDeviceId = backCamera.deviceId
        }
        
        console.log('Selected camera device:', selectedDeviceId)

        // Start decoding with the selected camera
        if (videoRef.current) {
          console.log('Starting QR code detection...')
          
          controlsRef.current = await codeReader.decodeFromVideoDevice(
            selectedDeviceId,
            videoRef.current,
            (result: Result | undefined, error?: Error) => {
              if (result) {
                const text = result.getText().trim()
                console.log('QR Code detected:', text)
                
                // Process immediately
                console.log('Processing QR code:', text)
                dispatch(resolveScannedValue(text))
              }
              
              // Only log significant errors
              if (error && error.name !== 'NotFoundException') {
                console.warn('Scan error:', error.name, error.message)
              }
            }
          )
          
          setCameraReady(true)
          console.log('Camera started successfully')
        }
      }
      
      // Race between camera initialization and timeout
      await Promise.race([initCamera(), timeoutPromise])
      
    } catch (e) {
      console.error('Camera initialization error:', e)
      setCameraReady(false)
      const errorMessage = e instanceof Error ? e.message : 'Unknown error'
      setErrorMsg(`Camera unavailable: ${errorMessage}. Please use the image upload option below.`)
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
            <label htmlFor="file-upload-input" className="file-upload-label">
              <input 
                id="file-upload-input"
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="file-input"
                aria-label="Upload QR code image"
              />
            </label>
            <label htmlFor="file-upload-button" className="upload-button-label">
              <button className="upload-button" id="file-upload-button">📁 Choose Image</button>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="file-input" 
                style={{ display: 'none' }}
                aria-label="Upload QR code image (hidden)"
              />
            </label>
          </div>

          {scanState.status === 'decoding' && <div className="scan-status"><p>Decoding…</p></div>}
          {(scanState.status === 'error' || errorMsg) && (
            <div className="scan-error">
              <p>
                {scanState.error === 'product_not_found' 
                  ? 'QR code not recognized. Please scan a Farmacia Tei product QR code.' 
                  : scanState.error === 'external_redirect'
                  ? 'Opening Farmacia Tei page in new tab...'
                  : (errorMsg ?? 'Scan error')
                }
              </p>
              <button onClick={() => dispatch(resetScan())} className="retry-button">Scan Another</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

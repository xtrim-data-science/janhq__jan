import React, { useState, useEffect } from 'react'
import DownloadApp from '@site/src/containers/DownloadApp'

import ThemedImage from '@theme/ThemedImage'

import Layout from '@theme/Layout'
import Banner from '@site/src/containers/Banner'

import useBaseUrl from '@docusaurus/useBaseUrl'

export default function Download() {
  return (
    <>
      <Banner />
      <Layout
        title="Download"
        description="Jan turns your computer into an AI machine by running LLMs locally on your computer. It's a privacy-focus, local-first, open-source solution."
      >
        <main>
          {/* Hero */}
          <div className="text-center px-4 py-20">
            <h1 className="text-6xl lg:text-7xl !font-normal leading-tight lg:leading-tight mt-2 font-serif">
              Download Jan for your desktop
            </h1>
            <p className="text-2xl -mt-1 leading-relaxed text-black/60 dark:text-white/60">
              Turn your computer into an AI machine
            </p>

            <div className="my-16">
              <ThemedImage
                className="w-28 mx-auto h-auto"
                alt="App screenshots"
                sources={{
                  light: useBaseUrl('/img/homepage/mac-system-black.svg'),
                  dark: useBaseUrl('/img/homepage/mac-system-white.svg'),
                }}
              />
            </div>
            <DownloadApp />
          </div>
        </main>
      </Layout>
    </>
  )
}

function $mapValues_modelExtensions_52_108_playbackUrl_440$34523(val, key, context) {
  return $res['$mapValues_modelExtensions_83_54_584'][val['componentType']]['Media.playbackUrl']
    ? ($res['$200'][key] &&
      $res['$200'][key]['background'] &&
      $res['$200'][key]['background']['mediaRef']
      ? ($res['$200'][key] &&
          $res['$200'][key]['background'] &&
          $res['$200'][key]['background']['mediaRef'])['type'] ===
        'WixVideo'
      : false)
      ? ((($res['$200'][key] &&
        $res['$200'][key]['background'] &&
        $res['$200'][key]['background']['mediaRef']
        ? ($res['$200'][key] &&
            $res['$200'][key]['background'] &&
            $res['$200'][key]['background']['mediaRef'])['qualities']
        : false)
          ? !($model['MediaAspect'][
              ($res['$200'][key] &&
                $res['$200'][key]['background'] &&
                $res['$200'][key]['background']['mediaRef'])['videoId']
            ]
              ? $model['MediaAspect'][
                  ($res['$200'][key] &&
                    $res['$200'][key]['background'] &&
                    $res['$200'][key]['background']['mediaRef'])['videoId']
                ]['fallback']
              : false) &&
            (!(
              ($res['$200'][key] &&
                $res['$200'][key]['background'] &&
                $res['$200'][key]['background']['mediaRef'])[
                'mediaFeatures'
              ] &&
              any(
                $mapValues_modelExtensions_52_108_playbackUrl_440$34523$34627,
                ($res['$200'][key] &&
                  $res['$200'][key]['background'] &&
                  $res['$200'][key]['background']['mediaRef'])[
                  'mediaFeatures'
                ],
                null
              )
            ) &&
              (($res['$200'][key] &&
                $res['$200'][key]['background'] &&
                $res['$200'][key]['background']['mediaRef'])[
                'adaptiveVideo'
              ] &&
                !!filter(
                  $mapValues_modelExtensions_52_108_playbackUrl_440$34523$34656,
                  ($res['$200'][key] &&
                    $res['$200'][key]['background'] &&
                    $res['$200'][key]['background']['mediaRef'])[
                    'adaptiveVideo'
                  ],
                  null
                )[0]) &&
              ($res['$200'][key] &&
                $res['$200'][key]['background'] &&
                $res['$200'][key]['background']['mediaRef'] &&
                ($res['$200'][key] &&
                  $res['$200'][key]['background'] &&
                  $res['$200'][key]['background']['mediaRef'])[
                  'duration'
                ] &&
                $funcLib['parseInt'].call(
                  $res,
                  $res['$200'][key] &&
                    $res['$200'][key]['background'] &&
                    $res['$200'][key]['background']['mediaRef'] &&
                    ($res['$200'][key] &&
                      $res['$200'][key]['background'] &&
                      $res['$200'][key]['background']['mediaRef'])[
                      'duration'
                    ]
                ) > 60))
            ? 'hls'
            : 'mp4'
          : '') === 'hls' &&
          $funcLib['joinURL'].call(
            $res,
            $model['serviceTopology']['adaptiveVideoDomain'],
            filter(
              $mapValues_modelExtensions_52_108_playbackUrl_440$34523$34723,
              ($res['$200'][key] &&
                $res['$200'][key]['background'] &&
                $res['$200'][key]['background']['mediaRef'])[
                'adaptiveVideo'
              ],
              null
            )[0]['url']
          )) ||
        ((($res['$200'][key] &&
        $res['$200'][key]['background'] &&
        $res['$200'][key]['background']['mediaRef']
        ? ($res['$200'][key] &&
            $res['$200'][key]['background'] &&
            $res['$200'][key]['background']['mediaRef'])['qualities']
        : false)
          ? !($model['MediaAspect'][
              ($res['$200'][key] &&
                $res['$200'][key]['background'] &&
                $res['$200'][key]['background']['mediaRef'])['videoId']
            ]
              ? $model['MediaAspect'][
                  ($res['$200'][key] &&
                    $res['$200'][key]['background'] &&
                    $res['$200'][key]['background']['mediaRef'])['videoId']
                ]['fallback']
              : false) &&
            (!(
              ($res['$200'][key] &&
                $res['$200'][key]['background'] &&
                $res['$200'][key]['background']['mediaRef'])[
                'mediaFeatures'
              ] &&
              any(
                $mapValues_modelExtensions_52_108_playbackUrl_440$34523$34810,
                ($res['$200'][key] &&
                  $res['$200'][key]['background'] &&
                  $res['$200'][key]['background']['mediaRef'])[
                  'mediaFeatures'
                ],
                null
              )
            ) &&
              (($res['$200'][key] &&
                $res['$200'][key]['background'] &&
                $res['$200'][key]['background']['mediaRef'])[
                'adaptiveVideo'
              ] &&
                !!filter(
                  $mapValues_modelExtensions_52_108_playbackUrl_440$34523$34839,
                  ($res['$200'][key] &&
                    $res['$200'][key]['background'] &&
                    $res['$200'][key]['background']['mediaRef'])[
                    'adaptiveVideo'
                  ],
                  null
                )[0]) &&
              ($res['$200'][key] &&
                $res['$200'][key]['background'] &&
                $res['$200'][key]['background']['mediaRef'] &&
                ($res['$200'][key] &&
                  $res['$200'][key]['background'] &&
                  $res['$200'][key]['background']['mediaRef'])[
                  'duration'
                ] &&
                $funcLib['parseInt'].call(
                  $res,
                  $res['$200'][key] &&
                    $res['$200'][key]['background'] &&
                    $res['$200'][key]['background']['mediaRef'] &&
                    ($res['$200'][key] &&
                      $res['$200'][key]['background'] &&
                      $res['$200'][key]['background']['mediaRef'])[
                      'duration'
                    ]
                ) > 60))
            ? 'hls'
            : 'mp4'
          : '') === 'mp4' &&
          (keyBy(
            $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35718,
            ($res['$200'][key] &&
              $res['$200'][key]['background'] &&
              $res['$200'][key]['background']['mediaRef'])['qualities'],
            null
          )[
            keyBy(
              $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35263,
              ($model['MediaAspect'] &&
                $model['MediaAspect'][
                  ($res['$200'][key] &&
                    $res['$200'][key]['background'] &&
                    $res['$200'][key]['background']['mediaRef'])['videoId']
                ] &&
                $model['MediaAspect'][
                  ($res['$200'][key] &&
                    $res['$200'][key]['background'] &&
                    $res['$200'][key]['background']['mediaRef'])['videoId']
                ]['readyQualities']) ||
                $res['$array_modes_73_36_197'],
              null
            )[
              (($res['$200'][key] &&
              $res['$200'][key]['background'] &&
              $res['$200'][key]['background']['mediaRef']
                ? ($res['$200'][key] &&
                    $res['$200'][key]['background'] &&
                    $res['$200'][key]['background']['mediaRef'])[
                    'qualities'
                  ]
                : false) &&
                ((filter(
                  $mapValues_modelExtensions_52_108_playbackUrl_440$34523$34936,
                  filter(
                    $mapValues_modelExtensions_52_108_playbackUrl_440$34523$34945,
                    ($res['$200'][key] &&
                      $res['$200'][key]['background'] &&
                      $res['$200'][key]['background']['mediaRef'] &&
                      ($res['$200'][key] &&
                        $res['$200'][key]['background'] &&
                        $res['$200'][key]['background']['mediaRef'])[
                        'qualities'
                      ]) ||
                      $res['$array_modes_73_36_197'],
                    null
                  ),
                  key === 'SITE_BACKGROUND'
                    ? $res['$object_videoQoS_73_49_654']
                    : $res['$mapValues_modelExtensions_52_108_structure_368'][key]['layout']
                )[0] ||
                  filter(
                    $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35012,
                    ($res['$200'][key] &&
                      $res['$200'][key]['background'] &&
                      $res['$200'][key]['background']['mediaRef'] &&
                      ($res['$200'][key] &&
                        $res['$200'][key]['background'] &&
                        $res['$200'][key]['background']['mediaRef'])[
                        'qualities'
                      ]) ||
                      $res['$array_modes_73_36_197'],
                    null
                  )[
                    size(
                      filter(
                        $mapValues_modelExtensions_52_108_playbackUrl_440$34523$34983,
                        ($res['$200'][key] &&
                          $res['$200'][key]['background'] &&
                          $res['$200'][key]['background']['mediaRef'] &&
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'])[
                            'qualities'
                          ]) ||
                          $res['$array_modes_73_36_197'],
                        null
                      )
                    ) - 1
                  ])['width'] > $res['$object_videoQoS_73_49_654']['width'] ||
                (filter(
                  $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35046,
                  filter(
                    $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35055,
                    ($res['$200'][key] &&
                      $res['$200'][key]['background'] &&
                      $res['$200'][key]['background']['mediaRef'] &&
                      ($res['$200'][key] &&
                        $res['$200'][key]['background'] &&
                        $res['$200'][key]['background']['mediaRef'])[
                        'qualities'
                      ]) ||
                      $res['$array_modes_73_36_197'],
                    null
                  ),
                  key === 'SITE_BACKGROUND'
                    ? $res['$object_videoQoS_73_49_654']
                    : $res['$mapValues_modelExtensions_52_108_structure_368'][key]['layout']
                )[0] ||
                  filter(
                    $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35122,
                    ($res['$200'][key] &&
                      $res['$200'][key]['background'] &&
                      $res['$200'][key]['background']['mediaRef'] &&
                      ($res['$200'][key] &&
                        $res['$200'][key]['background'] &&
                        $res['$200'][key]['background']['mediaRef'])[
                        'qualities'
                      ]) ||
                      $res['$array_modes_73_36_197'],
                    null
                  )[
                    size(
                      filter(
                        $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35093,
                        ($res['$200'][key] &&
                          $res['$200'][key]['background'] &&
                          $res['$200'][key]['background']['mediaRef'] &&
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'])[
                            'qualities'
                          ]) ||
                          $res['$array_modes_73_36_197'],
                        null
                      )
                    ) - 1
                  ]) > $res['$object_videoQoS_73_49_654']['height']
                  ? $res['$object_videoQoS_73_49_654']['quality']
                  : (filter(
                      $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35158,
                      filter(
                        $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35167,
                        ($res['$200'][key] &&
                          $res['$200'][key]['background'] &&
                          $res['$200'][key]['background']['mediaRef'] &&
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'])[
                            'qualities'
                          ]) ||
                          $res['$array_modes_73_36_197'],
                        null
                      ),
                      key === 'SITE_BACKGROUND'
                        ? $res['$object_videoQoS_73_49_654']
                        : $res['$mapValues_modelExtensions_52_108_structure_368'][key]['layout']
                    )[0] ||
                      filter(
                        $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35234,
                        ($res['$200'][key] &&
                          $res['$200'][key]['background'] &&
                          $res['$200'][key]['background']['mediaRef'] &&
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'])[
                            'qualities'
                          ]) ||
                          $res['$array_modes_73_36_197'],
                        null
                      )[
                        size(
                          filter(
                            $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35205,
                            ($res['$200'][key] &&
                              $res['$200'][key]['background'] &&
                              $res['$200'][key]['background']['mediaRef'] &&
                              ($res['$200'][key] &&
                                $res['$200'][key]['background'] &&
                                $res['$200'][key]['background'][
                                  'mediaRef'
                                ])['qualities']) ||
                              $res['$array_modes_73_36_197'],
                            null
                          )
                        ) - 1
                      ])['quality'])) ||
                ''
            ] ||
              (($model['MediaAspect'] &&
                $model['MediaAspect'][
                  ($res['$200'][key] &&
                    $res['$200'][key]['background'] &&
                    $res['$200'][key]['background']['mediaRef'])['videoId']
                ] &&
                $model['MediaAspect'][
                  ($res['$200'][key] &&
                    $res['$200'][key]['background'] &&
                    $res['$200'][key]['background']['mediaRef'])['videoId']
                ]['readyQualities']) ||
                $res['$array_modes_73_36_197'])[
                size(
                  ($model['MediaAspect'] &&
                    $model['MediaAspect'][
                      ($res['$200'][key] &&
                        $res['$200'][key]['background'] &&
                        $res['$200'][key]['background']['mediaRef'])[
                        'videoId'
                      ]
                    ] &&
                    $model['MediaAspect'][
                      ($res['$200'][key] &&
                        $res['$200'][key]['background'] &&
                        $res['$200'][key]['background']['mediaRef'])[
                        'videoId'
                      ]
                    ]['readyQualities']) ||
                    $res['$array_modes_73_36_197']
                ) - 1
              ] ||
              ((($res['$200'][key] &&
              $res['$200'][key]['background'] &&
              $res['$200'][key]['background']['mediaRef']
                ? ($res['$200'][key] &&
                    $res['$200'][key]['background'] &&
                    $res['$200'][key]['background']['mediaRef'])[
                    'qualities'
                  ]
                : false) &&
                ((filter(
                  $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35391,
                  filter(
                    $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35400,
                    ($res['$200'][key] &&
                      $res['$200'][key]['background'] &&
                      $res['$200'][key]['background']['mediaRef'] &&
                      ($res['$200'][key] &&
                        $res['$200'][key]['background'] &&
                        $res['$200'][key]['background']['mediaRef'])[
                        'qualities'
                      ]) ||
                      $res['$array_modes_73_36_197'],
                    null
                  ),
                  key === 'SITE_BACKGROUND'
                    ? $res['$object_videoQoS_73_49_654']
                    : $res['$mapValues_modelExtensions_52_108_structure_368'][key]['layout']
                )[0] ||
                  filter(
                    $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35467,
                    ($res['$200'][key] &&
                      $res['$200'][key]['background'] &&
                      $res['$200'][key]['background']['mediaRef'] &&
                      ($res['$200'][key] &&
                        $res['$200'][key]['background'] &&
                        $res['$200'][key]['background']['mediaRef'])[
                        'qualities'
                      ]) ||
                      $res['$array_modes_73_36_197'],
                    null
                  )[
                    size(
                      filter(
                        $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35438,
                        ($res['$200'][key] &&
                          $res['$200'][key]['background'] &&
                          $res['$200'][key]['background']['mediaRef'] &&
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'])[
                            'qualities'
                          ]) ||
                          $res['$array_modes_73_36_197'],
                        null
                      )
                    ) - 1
                  ])['width'] > $res['$object_videoQoS_73_49_654']['width'] ||
                (filter(
                  $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35501,
                  filter(
                    $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35510,
                    ($res['$200'][key] &&
                      $res['$200'][key]['background'] &&
                      $res['$200'][key]['background']['mediaRef'] &&
                      ($res['$200'][key] &&
                        $res['$200'][key]['background'] &&
                        $res['$200'][key]['background']['mediaRef'])[
                        'qualities'
                      ]) ||
                      $res['$array_modes_73_36_197'],
                    null
                  ),
                  key === 'SITE_BACKGROUND'
                    ? $res['$object_videoQoS_73_49_654']
                    : $res['$mapValues_modelExtensions_52_108_structure_368'][key]['layout']
                )[0] ||
                  filter(
                    $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35577,
                    ($res['$200'][key] &&
                      $res['$200'][key]['background'] &&
                      $res['$200'][key]['background']['mediaRef'] &&
                      ($res['$200'][key] &&
                        $res['$200'][key]['background'] &&
                        $res['$200'][key]['background']['mediaRef'])[
                        'qualities'
                      ]) ||
                      $res['$array_modes_73_36_197'],
                    null
                  )[
                    size(
                      filter(
                        $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35548,
                        ($res['$200'][key] &&
                          $res['$200'][key]['background'] &&
                          $res['$200'][key]['background']['mediaRef'] &&
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'])[
                            'qualities'
                          ]) ||
                          $res['$array_modes_73_36_197'],
                        null
                      )
                    ) - 1
                  ]) > $res['$object_videoQoS_73_49_654']['height']
                  ? $res['$object_videoQoS_73_49_654']['quality']
                  : (filter(
                      $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35613,
                      filter(
                        $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35622,
                        ($res['$200'][key] &&
                          $res['$200'][key]['background'] &&
                          $res['$200'][key]['background']['mediaRef'] &&
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'])[
                            'qualities'
                          ]) ||
                          $res['$array_modes_73_36_197'],
                        null
                      ),
                      key === 'SITE_BACKGROUND'
                        ? $res['$object_videoQoS_73_49_654']
                        : $res['$mapValues_modelExtensions_52_108_structure_368'][key]['layout']
                    )[0] ||
                      filter(
                        $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35689,
                        ($res['$200'][key] &&
                          $res['$200'][key]['background'] &&
                          $res['$200'][key]['background']['mediaRef'] &&
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'])[
                            'qualities'
                          ]) ||
                          $res['$array_modes_73_36_197'],
                        null
                      )[
                        size(
                          filter(
                            $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35660,
                            ($res['$200'][key] &&
                              $res['$200'][key]['background'] &&
                              $res['$200'][key]['background']['mediaRef'] &&
                              ($res['$200'][key] &&
                                $res['$200'][key]['background'] &&
                                $res['$200'][key]['background'][
                                  'mediaRef'
                                ])['qualities']) ||
                              $res['$array_modes_73_36_197'],
                            null
                          )
                        ) - 1
                      ])['quality'])) ||
                '')
          ]['url']
            ? $funcLib['joinURL'].call($res, $model['serviceTopology']['staticVideoUrl'], [
                keyBy(
                  $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36552,
                  ($res['$200'][key] &&
                    $res['$200'][key]['background'] &&
                    $res['$200'][key]['background']['mediaRef'])[
                    'qualities'
                  ],
                  null
                )[
                  keyBy(
                    $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36097,
                    ($model['MediaAspect'] &&
                      $model['MediaAspect'][
                        ($res['$200'][key] &&
                          $res['$200'][key]['background'] &&
                          $res['$200'][key]['background']['mediaRef'])[
                          'videoId'
                        ]
                      ] &&
                      $model['MediaAspect'][
                        ($res['$200'][key] &&
                          $res['$200'][key]['background'] &&
                          $res['$200'][key]['background']['mediaRef'])[
                          'videoId'
                        ]
                      ]['readyQualities']) ||
                      $res['$array_modes_73_36_197'],
                    null
                  )[
                    (($res['$200'][key] &&
                    $res['$200'][key]['background'] &&
                    $res['$200'][key]['background']['mediaRef']
                      ? ($res['$200'][key] &&
                          $res['$200'][key]['background'] &&
                          $res['$200'][key]['background']['mediaRef'])[
                          'qualities'
                        ]
                      : false) &&
                      ((filter(
                        $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35770,
                        filter(
                          $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35779,
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'] &&
                            ($res['$200'][key] &&
                              $res['$200'][key]['background'] &&
                              $res['$200'][key]['background']['mediaRef'])[
                              'qualities'
                            ]) ||
                            $res['$array_modes_73_36_197'],
                          null
                        ),
                        key === 'SITE_BACKGROUND'
                          ? $res['$object_videoQoS_73_49_654']
                          : $res['$mapValues_modelExtensions_52_108_structure_368'][key]['layout']
                      )[0] ||
                        filter(
                          $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35846,
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'] &&
                            ($res['$200'][key] &&
                              $res['$200'][key]['background'] &&
                              $res['$200'][key]['background']['mediaRef'])[
                              'qualities'
                            ]) ||
                            $res['$array_modes_73_36_197'],
                          null
                        )[
                          size(
                            filter(
                              $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35817,
                              ($res['$200'][key] &&
                                $res['$200'][key]['background'] &&
                                $res['$200'][key]['background'][
                                  'mediaRef'
                                ] &&
                                ($res['$200'][key] &&
                                  $res['$200'][key]['background'] &&
                                  $res['$200'][key]['background'][
                                    'mediaRef'
                                  ])['qualities']) ||
                                $res['$array_modes_73_36_197'],
                              null
                            )
                          ) - 1
                        ])['width'] > $res['$object_videoQoS_73_49_654']['width'] ||
                      (filter(
                        $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35880,
                        filter(
                          $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35889,
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'] &&
                            ($res['$200'][key] &&
                              $res['$200'][key]['background'] &&
                              $res['$200'][key]['background']['mediaRef'])[
                              'qualities'
                            ]) ||
                            $res['$array_modes_73_36_197'],
                          null
                        ),
                        key === 'SITE_BACKGROUND'
                          ? $res['$object_videoQoS_73_49_654']
                          : $res['$mapValues_modelExtensions_52_108_structure_368'][key]['layout']
                      )[0] ||
                        filter(
                          $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35956,
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'] &&
                            ($res['$200'][key] &&
                              $res['$200'][key]['background'] &&
                              $res['$200'][key]['background']['mediaRef'])[
                              'qualities'
                            ]) ||
                            $res['$array_modes_73_36_197'],
                          null
                        )[
                          size(
                            filter(
                              $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35927,
                              ($res['$200'][key] &&
                                $res['$200'][key]['background'] &&
                                $res['$200'][key]['background'][
                                  'mediaRef'
                                ] &&
                                ($res['$200'][key] &&
                                  $res['$200'][key]['background'] &&
                                  $res['$200'][key]['background'][
                                    'mediaRef'
                                  ])['qualities']) ||
                                $res['$array_modes_73_36_197'],
                              null
                            )
                          ) - 1
                        ]) > $res['$object_videoQoS_73_49_654']['height']
                        ? $res['$object_videoQoS_73_49_654']['quality']
                        : (filter(
                            $mapValues_modelExtensions_52_108_playbackUrl_440$34523$35992,
                            filter(
                              $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36001,
                              ($res['$200'][key] &&
                                $res['$200'][key]['background'] &&
                                $res['$200'][key]['background'][
                                  'mediaRef'
                                ] &&
                                ($res['$200'][key] &&
                                  $res['$200'][key]['background'] &&
                                  $res['$200'][key]['background'][
                                    'mediaRef'
                                  ])['qualities']) ||
                                $res['$array_modes_73_36_197'],
                              null
                            ),
                            key === 'SITE_BACKGROUND'
                              ? $res['$object_videoQoS_73_49_654']
                              : $res['$mapValues_modelExtensions_52_108_structure_368'][key]['layout']
                          )[0] ||
                            filter(
                              $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36068,
                              ($res['$200'][key] &&
                                $res['$200'][key]['background'] &&
                                $res['$200'][key]['background'][
                                  'mediaRef'
                                ] &&
                                ($res['$200'][key] &&
                                  $res['$200'][key]['background'] &&
                                  $res['$200'][key]['background'][
                                    'mediaRef'
                                  ])['qualities']) ||
                                $res['$array_modes_73_36_197'],
                              null
                            )[
                              size(
                                filter(
                                  $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36039,
                                  ($res['$200'][key] &&
                                    $res['$200'][key]['background'] &&
                                    $res['$200'][key]['background'][
                                      'mediaRef'
                                    ] &&
                                    ($res['$200'][key] &&
                                      $res['$200'][key]['background'] &&
                                      $res['$200'][key]['background'][
                                        'mediaRef'
                                      ])['qualities']) ||
                                    $res['$array_modes_73_36_197'],
                                  null
                                )
                              ) - 1
                            ])['quality'])) ||
                      ''
                  ] ||
                    (($model['MediaAspect'] &&
                      $model['MediaAspect'][
                        ($res['$200'][key] &&
                          $res['$200'][key]['background'] &&
                          $res['$200'][key]['background']['mediaRef'])[
                          'videoId'
                        ]
                      ] &&
                      $model['MediaAspect'][
                        ($res['$200'][key] &&
                          $res['$200'][key]['background'] &&
                          $res['$200'][key]['background']['mediaRef'])[
                          'videoId'
                        ]
                      ]['readyQualities']) ||
                      $res['$array_modes_73_36_197'])[
                      size(
                        ($model['MediaAspect'] &&
                          $model['MediaAspect'][
                            ($res['$200'][key] &&
                              $res['$200'][key]['background'] &&
                              $res['$200'][key]['background']['mediaRef'])[
                              'videoId'
                            ]
                          ] &&
                          $model['MediaAspect'][
                            ($res['$200'][key] &&
                              $res['$200'][key]['background'] &&
                              $res['$200'][key]['background']['mediaRef'])[
                              'videoId'
                            ]
                          ]['readyQualities']) ||
                          $res['$array_modes_73_36_197']
                      ) - 1
                    ] ||
                    ((($res['$200'][key] &&
                    $res['$200'][key]['background'] &&
                    $res['$200'][key]['background']['mediaRef']
                      ? ($res['$200'][key] &&
                          $res['$200'][key]['background'] &&
                          $res['$200'][key]['background']['mediaRef'])[
                          'qualities'
                        ]
                      : false) &&
                      ((filter(
                        $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36225,
                        filter(
                          $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36234,
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'] &&
                            ($res['$200'][key] &&
                              $res['$200'][key]['background'] &&
                              $res['$200'][key]['background']['mediaRef'])[
                              'qualities'
                            ]) ||
                            $res['$array_modes_73_36_197'],
                          null
                        ),
                        key === 'SITE_BACKGROUND'
                          ? $res['$object_videoQoS_73_49_654']
                          : $res['$mapValues_modelExtensions_52_108_structure_368'][key]['layout']
                      )[0] ||
                        filter(
                          $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36301,
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'] &&
                            ($res['$200'][key] &&
                              $res['$200'][key]['background'] &&
                              $res['$200'][key]['background']['mediaRef'])[
                              'qualities'
                            ]) ||
                            $res['$array_modes_73_36_197'],
                          null
                        )[
                          size(
                            filter(
                              $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36272,
                              ($res['$200'][key] &&
                                $res['$200'][key]['background'] &&
                                $res['$200'][key]['background'][
                                  'mediaRef'
                                ] &&
                                ($res['$200'][key] &&
                                  $res['$200'][key]['background'] &&
                                  $res['$200'][key]['background'][
                                    'mediaRef'
                                  ])['qualities']) ||
                                $res['$array_modes_73_36_197'],
                              null
                            )
                          ) - 1
                        ])['width'] > $res['$object_videoQoS_73_49_654']['width'] ||
                      (filter(
                        $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36335,
                        filter(
                          $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36344,
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'] &&
                            ($res['$200'][key] &&
                              $res['$200'][key]['background'] &&
                              $res['$200'][key]['background']['mediaRef'])[
                              'qualities'
                            ]) ||
                            $res['$array_modes_73_36_197'],
                          null
                        ),
                        key === 'SITE_BACKGROUND'
                          ? $res['$object_videoQoS_73_49_654']
                          : $res['$mapValues_modelExtensions_52_108_structure_368'][key]['layout']
                      )[0] ||
                        filter(
                          $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36411,
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'] &&
                            ($res['$200'][key] &&
                              $res['$200'][key]['background'] &&
                              $res['$200'][key]['background']['mediaRef'])[
                              'qualities'
                            ]) ||
                            $res['$array_modes_73_36_197'],
                          null
                        )[
                          size(
                            filter(
                              $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36382,
                              ($res['$200'][key] &&
                                $res['$200'][key]['background'] &&
                                $res['$200'][key]['background'][
                                  'mediaRef'
                                ] &&
                                ($res['$200'][key] &&
                                  $res['$200'][key]['background'] &&
                                  $res['$200'][key]['background'][
                                    'mediaRef'
                                  ])['qualities']) ||
                                $res['$array_modes_73_36_197'],
                              null
                            )
                          ) - 1
                        ]) > $res['$object_videoQoS_73_49_654']['height']
                        ? $res['$object_videoQoS_73_49_654']['quality']
                        : (filter(
                            $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36447,
                            filter(
                              $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36456,
                              ($res['$200'][key] &&
                                $res['$200'][key]['background'] &&
                                $res['$200'][key]['background'][
                                  'mediaRef'
                                ] &&
                                ($res['$200'][key] &&
                                  $res['$200'][key]['background'] &&
                                  $res['$200'][key]['background'][
                                    'mediaRef'
                                  ])['qualities']) ||
                                $res['$array_modes_73_36_197'],
                              null
                            ),
                            key === 'SITE_BACKGROUND'
                              ? $res['$object_videoQoS_73_49_654']
                              : $res['$mapValues_modelExtensions_52_108_structure_368'][key]['layout']
                          )[0] ||
                            filter(
                              $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36523,
                              ($res['$200'][key] &&
                                $res['$200'][key]['background'] &&
                                $res['$200'][key]['background'][
                                  'mediaRef'
                                ] &&
                                ($res['$200'][key] &&
                                  $res['$200'][key]['background'] &&
                                  $res['$200'][key]['background'][
                                    'mediaRef'
                                  ])['qualities']) ||
                                $res['$array_modes_73_36_197'],
                              null
                            )[
                              size(
                                filter(
                                  $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36494,
                                  ($res['$200'][key] &&
                                    $res['$200'][key]['background'] &&
                                    $res['$200'][key]['background'][
                                      'mediaRef'
                                    ] &&
                                    ($res['$200'][key] &&
                                      $res['$200'][key]['background'] &&
                                      $res['$200'][key]['background'][
                                        'mediaRef'
                                      ])['qualities']) ||
                                    $res['$array_modes_73_36_197'],
                                  null
                                )
                              ) - 1
                            ])['quality'])) ||
                      '')
                ]['url']
              ])
            : $funcLib['joinURL'].call($res, $model['serviceTopology']['staticVideoUrl'], [
                ($res['$200'][key] &&
                  $res['$200'][key]['background'] &&
                  $res['$200'][key]['background']['mediaRef'])['videoId'],
                (($res['$200'][key] &&
                $res['$200'][key]['background'] &&
                $res['$200'][key]['background']['mediaRef']
                  ? ($res['$200'][key] &&
                      $res['$200'][key]['background'] &&
                      $res['$200'][key]['background']['mediaRef'])[
                      'qualities'
                    ]
                  : false) &&
                  ((filter(
                    $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36611,
                    filter(
                      $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36620,
                      ($res['$200'][key] &&
                        $res['$200'][key]['background'] &&
                        $res['$200'][key]['background']['mediaRef'] &&
                        ($res['$200'][key] &&
                          $res['$200'][key]['background'] &&
                          $res['$200'][key]['background']['mediaRef'])[
                          'qualities'
                        ]) ||
                        $res['$array_modes_73_36_197'],
                      null
                    ),
                    key === 'SITE_BACKGROUND'
                      ? $res['$object_videoQoS_73_49_654']
                      : $res['$mapValues_modelExtensions_52_108_structure_368'][key]['layout']
                  )[0] ||
                    filter(
                      $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36687,
                      ($res['$200'][key] &&
                        $res['$200'][key]['background'] &&
                        $res['$200'][key]['background']['mediaRef'] &&
                        ($res['$200'][key] &&
                          $res['$200'][key]['background'] &&
                          $res['$200'][key]['background']['mediaRef'])[
                          'qualities'
                        ]) ||
                        $res['$array_modes_73_36_197'],
                      null
                    )[
                      size(
                        filter(
                          $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36658,
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'] &&
                            ($res['$200'][key] &&
                              $res['$200'][key]['background'] &&
                              $res['$200'][key]['background']['mediaRef'])[
                              'qualities'
                            ]) ||
                            $res['$array_modes_73_36_197'],
                          null
                        )
                      ) - 1
                    ])['width'] > $res['$object_videoQoS_73_49_654']['width'] ||
                  (filter(
                    $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36721,
                    filter(
                      $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36730,
                      ($res['$200'][key] &&
                        $res['$200'][key]['background'] &&
                        $res['$200'][key]['background']['mediaRef'] &&
                        ($res['$200'][key] &&
                          $res['$200'][key]['background'] &&
                          $res['$200'][key]['background']['mediaRef'])[
                          'qualities'
                        ]) ||
                        $res['$array_modes_73_36_197'],
                      null
                    ),
                    key === 'SITE_BACKGROUND'
                      ? $res['$object_videoQoS_73_49_654']
                      : $res['$mapValues_modelExtensions_52_108_structure_368'][key]['layout']
                  )[0] ||
                    filter(
                      $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36797,
                      ($res['$200'][key] &&
                        $res['$200'][key]['background'] &&
                        $res['$200'][key]['background']['mediaRef'] &&
                        ($res['$200'][key] &&
                          $res['$200'][key]['background'] &&
                          $res['$200'][key]['background']['mediaRef'])[
                          'qualities'
                        ]) ||
                        $res['$array_modes_73_36_197'],
                      null
                    )[
                      size(
                        filter(
                          $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36768,
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'] &&
                            ($res['$200'][key] &&
                              $res['$200'][key]['background'] &&
                              $res['$200'][key]['background']['mediaRef'])[
                              'qualities'
                            ]) ||
                            $res['$array_modes_73_36_197'],
                          null
                        )
                      ) - 1
                    ]) > $res['$object_videoQoS_73_49_654']['height']
                    ? $res['$object_videoQoS_73_49_654']['quality']
                    : (filter(
                        $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36833,
                        filter(
                          $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36842,
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'] &&
                            ($res['$200'][key] &&
                              $res['$200'][key]['background'] &&
                              $res['$200'][key]['background']['mediaRef'])[
                              'qualities'
                            ]) ||
                            $res['$array_modes_73_36_197'],
                          null
                        ),
                        key === 'SITE_BACKGROUND'
                          ? $res['$object_videoQoS_73_49_654']
                          : $res['$mapValues_modelExtensions_52_108_structure_368'][key]['layout']
                      )[0] ||
                        filter(
                          $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36909,
                          ($res['$200'][key] &&
                            $res['$200'][key]['background'] &&
                            $res['$200'][key]['background']['mediaRef'] &&
                            ($res['$200'][key] &&
                              $res['$200'][key]['background'] &&
                              $res['$200'][key]['background']['mediaRef'])[
                              'qualities'
                            ]) ||
                            $res['$array_modes_73_36_197'],
                          null
                        )[
                          size(
                            filter(
                              $mapValues_modelExtensions_52_108_playbackUrl_440$34523$36880,
                              ($res['$200'][key] &&
                                $res['$200'][key]['background'] &&
                                $res['$200'][key]['background'][
                                  'mediaRef'
                                ] &&
                                ($res['$200'][key] &&
                                  $res['$200'][key]['background'] &&
                                  $res['$200'][key]['background'][
                                    'mediaRef'
                                  ])['qualities']) ||
                                $res['$array_modes_73_36_197'],
                              null
                            )
                          ) - 1
                        ])['quality'])) ||
                  '',
                'mp4',
                'file.mp4'
              ]))) ||
        ''
      : ''
    : null;
}
